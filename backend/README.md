# Backend — Revenue OS API (Laravel)

> **Design stage.** Not scaffolded yet — the structure and contract are designed
> first (below), then Laravel gets installed.

An API-only Laravel app that serves the React frontend in
[`../frontend`](../frontend), replacing the in-browser simulated data engine
(`frontend/src/lib/engine.js`) with real, persisted data.

## Design docs

Read these before scaffolding — they are the contract the implementation follows:

1. [`docs/01-data-model.md`](docs/01-data-model.md) — tables, columns, relations,
   and the mapping back to the frontend shapes.
2. [`docs/02-api-endpoints.md`](docs/02-api-endpoints.md) — the JSON REST API and
   which frontend page each endpoint feeds.
3. [`docs/03-app-structure.md`](docs/03-app-structure.md) — Laravel folder layout,
   stack choices, and the build order.

## Status

- [x] Data model designed
- [x] API endpoints designed
- [x] App structure designed
- [x] Laravel installed + skeleton (Laravel 13 + Sanctum + SQLite)
- [x] Migrations / models / enums / resources / requests / routes
- [x] PlanSeeder (real); read endpoints functional
- [ ] `MetricsService` + `SubscriptionService` implemented
- [ ] `DemoDataSeeder` (port of `generateData()`)
- [ ] Frontend wired to the API

## Local development

```bash
cd backend
# vendor/ is gitignored — install once after cloning:
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve            # http://127.0.0.1:8000
```

Quick check: `curl http://127.0.0.1:8000/api/plans` returns the four tiers.
The data endpoints (`/api/customers`, `/api/metrics`) respond with valid,
correctly-shaped JSON; they fill in once `DemoDataSeeder` and the services are
implemented.

See the root [`README.md`](../README.md) for the overall project.
