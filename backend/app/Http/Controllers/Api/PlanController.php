<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanController extends Controller
{
    /** Colors for custom tiers, cycled by how many plans the team has. */
    private const RAMP = ['#AC9BE6', '#8E77DB', '#6E56CF', '#4B3494', '#3E8E7E', '#C05C99', '#5C7CC0', '#C08A5C'];

    public function index(Request $request)
    {
        $plans = Plan::query()
            ->where('team_id', $request->user()->team_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return PlanResource::collection($plans);
    }

    /** Create a tier. MRR is derived: yearly prices are recognized per month. */
    public function store(Request $request)
    {
        $data = $this->validated($request);
        $teamId = $request->user()->team_id;

        $plan = Plan::create([
            'team_id' => $teamId,
            'slug' => $this->uniqueSlug($data['name'], $teamId),
            'name' => $data['name'],
            'blurb' => $data['blurb'] ?? null,
            'price_cents' => $data['price_cents'],
            'interval' => $data['interval'],
            'mrr_cents' => $this->mrrCents($data),
            'ramp_color' => self::RAMP[Plan::where('team_id', $teamId)->count() % count(self::RAMP)],
            'sort_order' => (Plan::where('team_id', $teamId)->max('sort_order') ?? -1) + 1,
        ]);

        return (new PlanResource($plan))->response()->setStatusCode(201);
    }

    /** Update a tier (slug stays; historical events keep their old deltas). */
    public function update(Request $request, int $plan)
    {
        $plan = $this->scoped($request, $plan);
        $data = $this->validated($request);

        $plan->update([
            'name' => $data['name'],
            'blurb' => $data['blurb'] ?? null,
            'price_cents' => $data['price_cents'],
            'interval' => $data['interval'],
            'mrr_cents' => $this->mrrCents($data),
        ]);

        return new PlanResource($plan);
    }

    /** Delete a tier — only when nothing references it. */
    public function destroy(Request $request, int $plan)
    {
        $plan = $this->scoped($request, $plan);

        if ($plan->subscriptions()->exists()) {
            return response()->json(['message' => 'plan_in_use'], 422);
        }

        try {
            $plan->delete();
        } catch (QueryException) {
            // historical events/invoices still reference it
            return response()->json(['message' => 'plan_in_use'], 422);
        }

        return response()->noContent();
    }

    private function scoped(Request $request, int $id): Plan
    {
        return Plan::query()->where('team_id', $request->user()->team_id)->findOrFail($id);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'blurb' => ['nullable', 'string', 'max:160'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'interval' => ['required', 'in:month,year'],
        ]);
        $data['price_cents'] = (int) round($data['price'] * 100);

        return $data;
    }

    private function mrrCents(array $data): int
    {
        return $data['interval'] === 'year'
            ? (int) round($data['price_cents'] / 12)
            : $data['price_cents'];
    }

    private function uniqueSlug(string $name, int $teamId): string
    {
        $base = Str::slug($name) ?: 'plan';
        $slug = $base;
        for ($i = 2; Plan::where('team_id', $teamId)->where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
