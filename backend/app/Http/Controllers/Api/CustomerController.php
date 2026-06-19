<?php

namespace App\Http\Controllers\Api;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerDetailResource;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;

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

        // Direct-column sorts; plan/mrr/status sorts join the subscription —
        // TODO(impl): add those joins alongside the MetricsService work.
        $dir = $request->string('dir')->value() === 'asc' ? 'asc' : 'desc';
        $sort = $request->string('sort')->value();
        $column = match ($sort) {
            'name' => 'name',
            'country' => 'country',
            'signup' => 'signed_up_at',
            default => 'signed_up_at',
        };
        $query->orderBy($column, $dir);

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
