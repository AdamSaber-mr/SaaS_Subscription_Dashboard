<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Imports customers + subscriptions from a CSV. All-or-nothing: every row is
 * validated first and any problem aborts the import with per-row errors.
 *
 * For each row we write the full event-sourced history — a `new` event at the
 * start date, a `churn` event when canceled, and monthly paid invoices — so
 * the metrics and charts light up with real history immediately.
 *
 * Expected header (order-free, comma or semicolon separated):
 *   name,plan[,email,country,started_at,status,canceled_at]
 */
class CustomerImportService
{
    public const MAX_ROWS = 2000;

    private const COUNTRY_CODES = [
        'netherlands' => 'NL', 'nederland' => 'NL', 'belgium' => 'BE', 'belgië' => 'BE',
        'germany' => 'DE', 'duitsland' => 'DE', 'united kingdom' => 'GB', 'france' => 'FR',
        'frankrijk' => 'FR', 'spain' => 'ES', 'spanje' => 'ES', 'sweden' => 'SE', 'zweden' => 'SE',
        'united states' => 'US', 'canada' => 'CA', 'australia' => 'AU', 'australië' => 'AU', 'india' => 'IN',
    ];

    /** @return array{imported?: int, errors?: array<int, string>} */
    public function import(string $csv, int $teamId): array
    {
        [$rows, $errors] = $this->parse($csv, $teamId);
        if ($errors) {
            return ['errors' => $errors];
        }

        DB::transaction(function () use ($rows, $teamId) {
            foreach ($rows as $row) {
                $this->importRow($row, $teamId);
            }
        });

        return ['imported' => count($rows)];
    }

    /** @return array{0: array<int, array>, 1: array<int, string>} */
    private function parse(string $csv, int $teamId): array
    {
        $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv); // strip BOM
        $lines = preg_split('/\r\n|\r|\n/', trim($csv));
        if (count($lines) < 2) {
            return [[], [0 => 'empty_file']];
        }
        if (count($lines) - 1 > self::MAX_ROWS) {
            return [[], [0 => 'too_many_rows']];
        }

        // Dutch Excel exports use semicolons; sniff the header.
        $delimiter = substr_count($lines[0], ';') > substr_count($lines[0], ',') ? ';' : ',';
        $header = array_map(fn ($h) => strtolower(trim($h)), str_getcsv($lines[0], $delimiter));
        if (! in_array('name', $header, true) || ! in_array('plan', $header, true)) {
            return [[], [0 => 'missing_columns']];
        }

        $plans = Plan::where('team_id', $teamId)->get();
        $existingEmails = Customer::where('team_id', $teamId)->pluck('email')
            ->map(fn ($e) => strtolower($e))->flip()->all();
        $seenEmails = [];
        $today = CarbonImmutable::now();

        $rows = [];
        $errors = [];
        foreach (array_slice($lines, 1) as $i => $line) {
            $n = $i + 2; // 1-based, incl. header
            if (trim($line) === '') {
                continue;
            }
            $cells = str_getcsv($line, $delimiter);
            $row = [];
            foreach ($header as $ci => $key) {
                $row[$key] = trim($cells[$ci] ?? '');
            }

            if ($row['name'] === '') {
                $errors[$n] = 'name_required';

                continue;
            }

            $plan = $plans->first(fn ($p) => $p->slug === strtolower($row['plan']) || strcasecmp($p->name, $row['plan']) === 0);
            if (! $plan) {
                $errors[$n] = 'unknown_plan';

                continue;
            }

            $email = strtolower($row['email'] ?? '');
            if ($email !== '') {
                if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[$n] = 'invalid_email';

                    continue;
                }
                if (isset($existingEmails[$email]) || isset($seenEmails[$email])) {
                    $errors[$n] = 'duplicate_email';

                    continue;
                }
                $seenEmails[$email] = true;
            }

            try {
                $startedAt = ($row['started_at'] ?? '') !== ''
                    ? CarbonImmutable::parse($row['started_at'])
                    : $today;
            } catch (\Throwable) {
                $errors[$n] = 'invalid_date';

                continue;
            }
            if ($startedAt->isAfter($today) || $startedAt->isBefore($today->subYears(10))) {
                $errors[$n] = 'invalid_date';

                continue;
            }

            $status = strtolower($row['status'] ?? '') === 'canceled' ? 'canceled' : 'active';
            $canceledAt = null;
            if ($status === 'canceled') {
                try {
                    $canceledAt = ($row['canceled_at'] ?? '') !== ''
                        ? CarbonImmutable::parse($row['canceled_at'])
                        : $today;
                } catch (\Throwable) {
                    $errors[$n] = 'invalid_date';

                    continue;
                }
                if ($canceledAt->isBefore($startedAt) || $canceledAt->isAfter($today)) {
                    $errors[$n] = 'invalid_date';

                    continue;
                }
            }

            $rows[] = [
                'name' => $row['name'],
                'email' => $email ?: null,
                'country' => $row['country'] ?? '',
                'plan' => $plan,
                'started_at' => $startedAt,
                'status' => $status,
                'canceled_at' => $canceledAt,
            ];
        }

        return [$rows, $errors];
    }

    private function importRow(array $row, int $teamId): void
    {
        $plan = $row['plan'];

        $customer = Customer::create([
            'team_id' => $teamId,
            'name' => $row['name'],
            'email' => $row['email'] ?? $this->fallbackEmail($row['name'], $teamId),
            'country' => $row['country'] !== '' ? $row['country'] : 'Netherlands',
            'country_code' => $row['country'] !== ''
                ? (self::COUNTRY_CODES[strtolower($row['country'])] ?? '--')
                : 'NL',
            'signed_up_at' => $row['started_at']->toDateString(),
        ]);

        $subscription = $customer->subscription()->create([
            'team_id' => $teamId,
            'plan_id' => $plan->id,
            'status' => $row['status'] === 'canceled' ? SubscriptionStatus::Canceled : SubscriptionStatus::Active,
            'billing_interval' => $plan->interval,
            'started_at' => $row['started_at']->toDateString(),
            'canceled_at' => $row['canceled_at']?->toDateString(),
        ]);

        $subscription->events()->create([
            'team_id' => $teamId,
            'customer_id' => $customer->id,
            'type' => EventType::New,
            'to_plan_id' => $plan->id,
            'mrr_delta_cents' => $plan->mrr_cents,
            'occurred_at' => $row['started_at']->toDateString(),
        ]);

        if ($row['canceled_at']) {
            $subscription->events()->create([
                'team_id' => $teamId,
                'customer_id' => $customer->id,
                'type' => EventType::Churn,
                'from_plan_id' => $plan->id,
                'to_plan_id' => $plan->id,
                'mrr_delta_cents' => -$plan->mrr_cents,
                'occurred_at' => $row['canceled_at']->toDateString(),
            ]);
        }

        // Paid invoice history: monthly, or on the anniversary for yearly plans.
        $end = $row['canceled_at'] ?? CarbonImmutable::now();
        $invoices = [];
        for ($m = 0; $m <= 120; $m++) {
            $date = $row['started_at']->addMonths($m);
            if ($date->isAfter($end)) {
                break;
            }
            if ($plan->interval->value === 'year' && $m % 12 !== 0) {
                continue;
            }
            $invoices[] = [
                'team_id' => $teamId,
                'customer_id' => $customer->id,
                'subscription_id' => $subscription->id,
                'plan_id' => $plan->id,
                'amount_cents' => $plan->price_cents,
                'status' => InvoiceStatus::Paid->value,
                'issued_at' => $date->toDateString(),
                'is_retry' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        if ($invoices) {
            DB::table('invoices')->insert($invoices);
        }
    }

    private function fallbackEmail(string $name, int $teamId): string
    {
        $slug = preg_replace('/[^a-z]/', '', strtolower($name)) ?: 'klant';
        $email = "billing@{$slug}.com";
        for ($i = 2; Customer::where('team_id', $teamId)->where('email', $email)->exists(); $i++) {
            $email = "billing{$i}@{$slug}.com";
        }

        return $email;
    }
}
