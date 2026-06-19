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

    /**
     * Active subscriptions, optionally filtered by plan slug (?plan=growth).
     */
    public function index(Request $request)
    {
        $query = Subscription::query()
            ->with(['customer', 'plan'])
            ->where('status', SubscriptionStatus::Active);

        if (($plan = $request->string('plan')->value()) && $plan !== 'all') {
            $query->whereHas('plan', fn ($q) => $q->where('slug', $plan));
        }

        return SubscriptionResource::collection($query->paginate(50));
    }

    /** New subscription (new customer + first invoice + `new` event). */
    public function store(StoreSubscriptionRequest $request)
    {
        $subscription = $this->subscriptions->create($request->validated());

        return new SubscriptionResource($subscription->load(['customer', 'plan']));
    }

    /** Change plan (appends expansion/contraction event). */
    public function update(UpdateSubscriptionRequest $request, Subscription $subscription)
    {
        $subscription = $this->subscriptions->changePlan($subscription, $request->validated('plan'));

        return new SubscriptionResource($subscription->load(['customer', 'plan']));
    }

    /** Cancel (appends `churn` event). */
    public function destroy(Subscription $subscription)
    {
        $subscription = $this->subscriptions->cancel($subscription);

        return new SubscriptionResource($subscription->load(['customer', 'plan']));
    }
}
