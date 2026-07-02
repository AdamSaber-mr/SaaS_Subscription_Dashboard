<?php

namespace App\Http\Controllers\Api;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionRequest;
use App\Http\Requests\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    /** A subscription by id, but only within the caller's team (else 404). */
    private function scoped(Request $request, int $id): Subscription
    {
        return Subscription::query()
            ->where('team_id', $request->user()->team_id)
            ->findOrFail($id);
    }

    /**
     * Active subscriptions, optionally filtered by plan slug (?plan=growth).
     */
    public function index(Request $request)
    {
        $query = Subscription::query()
            ->where('team_id', $request->user()->team_id)
            ->with(['customer', 'plan'])
            ->where('status', SubscriptionStatus::Active);

        if (($plan = $request->string('plan')->value()) && $plan !== 'all') {
            $query->whereHas('plan', fn ($q) => $q->where('slug', $plan));
        }

        // Newest first, so a just-created subscription is visible right away.
        $query->orderByDesc('started_at')->orderByDesc('id');

        return SubscriptionResource::collection($query->paginate(50));
    }

    /** New subscription (new customer + first invoice + `new` event). */
    public function store(StoreSubscriptionRequest $request)
    {
        $subscription = $this->subscriptions->create($request->validated(), $request->user()->team_id);

        return new SubscriptionResource($subscription->load(['customer', 'plan']));
    }

    /** Change plan (appends expansion/contraction event). */
    public function update(UpdateSubscriptionRequest $request, int $subscription)
    {
        $subscription = $this->subscriptions->changePlan(
            $this->scoped($request, $subscription),
            $request->validated('plan'),
        );

        return new SubscriptionResource($subscription->load(['customer', 'plan']));
    }

    /** Cancel (appends `churn` event). */
    public function destroy(Request $request, int $subscription)
    {
        $subscription = $this->subscriptions->cancel($this->scoped($request, $subscription));

        return new SubscriptionResource($subscription->load(['customer', 'plan']));
    }
}
