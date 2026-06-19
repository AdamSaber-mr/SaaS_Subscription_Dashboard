# Backend design — 3. Laravel app structure

How the Laravel project will be laid out inside `backend/`, and the order we'll
build it. This is the **target skeleton** for the next step (installing Laravel);
nothing here exists yet.

## Stack

- **Laravel 11** (API-focused), PHP 8.4 (already installed).
- **SQLite** for dev (zero-config, already on the machine) → MySQL/Postgres later.
- **Laravel Sanctum** for SPA auth (scaffolded, login wired up later).
- **API Resources** for response shaping; **Form Requests** for validation.
- **Pest** (or PHPUnit) for tests.

## Folder layout (the parts we add)

```
backend/
├── app/
│   ├── Models/
│   │   ├── Plan.php
│   │   ├── Customer.php
│   │   ├── Subscription.php
│   │   ├── SubscriptionEvent.php
│   │   └── Invoice.php
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── PlanController.php          # index
│   │   │   ├── CustomerController.php      # index, show
│   │   │   ├── SubscriptionController.php  # index, store, update, destroy
│   │   │   ├── MetricsController.php       # index (?period=)
│   │   │   └── AuthController.php          # login, logout, user
│   │   ├── Requests/
│   │   │   ├── StoreSubscriptionRequest.php
│   │   │   └── UpdateSubscriptionRequest.php
│   │   └── Resources/
│   │       ├── PlanResource.php
│   │       ├── CustomerResource.php          # list row
│   │       ├── CustomerDetailResource.php    # detail + timeline + invoices
│   │       ├── SubscriptionResource.php
│   │       └── MetricsResource.php
│   ├── Services/
│   │   ├── MetricsService.php       # port of aggregates() + periodMetrics()
│   │   └── SubscriptionService.php  # new / change-plan / cancel + event logging
│   └── Enums/
│       ├── PlanInterval.php
│       ├── SubscriptionStatus.php
│       ├── EventType.php
│       └── InvoiceStatus.php
├── database/
│   ├── migrations/      # one per table (doc 1)
│   ├── factories/       # CustomerFactory, SubscriptionFactory, …
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── PlanSeeder.php        # the 4 fixed tiers
│       └── DemoDataSeeder.php    # PHP port of generateData() (seeded RNG)
├── routes/
│   └── api.php          # all endpoints from doc 2
├── tests/
│   └── Feature/Api/     # endpoint tests
├── .env.example
└── composer.json
```

## Design notes

- **Thin controllers, logic in services.** `MetricsService` is the PHP port of
  the frontend's `aggregates()` + `periodMetrics()`; `SubscriptionService` owns
  the create / change-plan / cancel transitions and writes the matching
  `subscription_event`. Controllers just validate → call service → return resource.
- **Resources own the JSON shape**, so the documented response formats (doc 2)
  are guaranteed in one place and money is converted from cents there.
- **Enums** back the status/type/interval columns for type-safety.
- **Seeder parity.** `DemoDataSeeder` reproduces the same believable 18-month
  dataset the frontend generates now, so swapping to the API changes the source,
  not the look.

## Build order (next steps after this design is approved)

1. Install Composer + `composer create-project laravel/laravel backend` (then
   re-home into the existing folder), configure `.env` for SQLite, add Sanctum.
2. Migrations + Enums + Models with relationships (empty but wired).
3. `PlanSeeder` + `DemoDataSeeder` so the DB has data to serve.
4. Routes + controllers + resources as **stubs** (return shaped sample data).
5. Implement `MetricsService` and `SubscriptionService` for real.
6. Point the frontend at the API (add an `api/` client layer, swap out the
   in-browser engine), endpoint by endpoint.
7. Tests for each endpoint.

Steps 1–4 are the "structure" milestone; 5–7 are the "real implementation".

## How the frontend will consume it (later)

Today all data flows through `frontend/src/lib/engine.js` and the `customers`
array in `DashboardContext`. The swap:

1. Add a small `frontend/src/api/` client (fetch wrappers per endpoint).
2. Load metrics/customers into context state on mount instead of generating them.
3. Repoint the lifecycle actions (`doChangePlan`, `doCancel`, `doNewSub`) at the
   `POST/PATCH/DELETE /api/subscriptions` endpoints.

The charts, pages and formatting stay unchanged.
