<?php

namespace App\Http\Controllers\Api;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerDetailResource;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Paginated, searchable, filterable customer list.
     * Query: search, status (all|active|churned), sort, dir, page.
     */
    public function index(Request $request)
    {
        $query = Customer::query()->with('subscription.plan');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('country', 'like', "%{$search}%");
            });
        }

        $status = $request->string('status')->value();
        if (in_array($status, ['active', 'churned'], true)) {
            $query->whereHas('subscription', fn ($q) => $q->where(
                'status',
                $status === 'active' ? SubscriptionStatus::Active : SubscriptionStatus::Canceled,
            ));
        }

        $dir = $request->string('dir')->value() === 'asc' ? 'asc' : 'desc';
        $sort = $request->string('sort')->value();

        // plan/mrr/status live on the subscription (+plan); sort via subqueries
        // so the eager loads and pagination stay intact.
        $subscriptions = fn () => DB::table('subscriptions')
            ->whereColumn('subscriptions.customer_id', 'customers.id');

        match ($sort) {
            'name' => $query->orderBy('name', $dir),
            'country' => $query->orderBy('country', $dir),
            'status' => $query->orderBy($subscriptions()->select('status'), $dir),
            'plan' => $query->orderBy(
                $subscriptions()->join('plans', 'plans.id', '=', 'subscriptions.plan_id')->select('plans.sort_order'),
                $dir,
            ),
            'mrr' => $query->orderBy(
                $subscriptions()
                    ->join('plans', 'plans.id', '=', 'subscriptions.plan_id')
                    ->selectRaw("case when subscriptions.status = 'active' then plans.mrr_cents else 0 end"),
                $dir,
            ),
            default => $query->orderBy('signed_up_at', $dir),
        };

        return CustomerResource::collection($query->paginate(40));
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'subscription.plan',
            'events.fromPlan',
            'events.toPlan',
            'invoices',
        ]);

        return new CustomerDetailResource($customer);
    }
}
