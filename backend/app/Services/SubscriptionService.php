<?php

namespace App\Services;

use App\Models\Subscription;

/**
 * Owns the subscription lifecycle transitions and writes the matching
 * subscription_event for each (so metrics stay derivable from the event log).
 *
 * STUB — ports the frontend's doNewSub() / doChangePlan() / doCancel()
 * (frontend/src/store/DashboardContext.jsx). Method signatures are final;
 * the transactional logic + event creation land in the implementation phase.
 */
class SubscriptionService
{
    /**
     * Create a customer + subscription + first invoice + `new` event.
     *
     * @param  array{name: string, plan: string}  $data
     */
    public function create(array $data): Subscription
    {
        // TODO(impl): resolve plan by slug, create Customer + Subscription +
        // Invoice, append a `new` SubscriptionEvent, inside a DB transaction.
        throw new \RuntimeException('SubscriptionService::create not implemented yet');
    }

    /**
     * Move a subscription to a new plan, appending an expansion/contraction
     * event (reactivating if it was canceled).
     */
    public function changePlan(Subscription $subscription, string $planSlug): Subscription
    {
        // TODO(impl): diff MRR, append expansion|contraction event, update plan.
        throw new \RuntimeException('SubscriptionService::changePlan not implemented yet');
    }

    /**
     * Cancel a subscription, appending a `churn` event.
     */
    public function cancel(Subscription $subscription): Subscription
    {
        // TODO(impl): set status canceled + canceled_at, append churn event.
        throw new \RuntimeException('SubscriptionService::cancel not implemented yet');
    }
}
