# Backend design — 2. API endpoints

A versioned, JSON REST API under `/api`. Each endpoint notes which part of the
current frontend (`frontend/src/`) it will feed.

**Conventions**
- JSON in / JSON out; money as whole-dollar numbers (frontend formats itself).
- List endpoints are paginated (Laravel pagination envelope) where relevant.
- Mutations return the affected resource so the SPA can update without a refetch.
- Wrapped in API Resources (see doc 3) for a stable shape.

## Reference & metrics

### `GET /api/plans`
All active plans. → Plans page, modal plan picker, badges.
```jsonc
[{ "id": "growth", "name": "Growth", "price": 99, "interval": "month",
   "mrr": 99, "blurb": "…", "rampColor": "#9A84E6" }]
```

### `GET /api/metrics?period=`
The heart of the dashboard. `period` ∈ `this_month | last_month | last_quarter |
last_12` (default `last_12`). Replaces `aggregates()` + `periodMetrics()` and
feeds the Dashboard **and** Insights pages.
```jsonc
{
  "period": "last_12",
  "kpis": { "mrr": 35873, "arr": 430476, "activeCustomers": 312,
            "netNewMrr": 28140, "deltas": { "mrr": 0.122, "customers": 0.08 } },
  "movements": { "newM": 26200, "expM": 4100, "conM": 900, "chuM": 1260,
                 "net": 28140 },
  "stats": { "nrr": 1.037, "quickRatio": 11.2, "arpu": 115,
             "ltv": 5085, "customerChurn": 0.04, "revenueChurn": 0.021 },
  "trend":  { "months": ["Jan '25", …], "mrr": [...], "activeCustomers": [...] },
  "cohort": { "labels": [...], "grid": [[1.0, 0.93, …], …] }
}
```

> The Insights page text is derived from these same numbers — kept on the
> frontend (presentation), so no separate endpoint is needed.

## Customers

### `GET /api/customers`
Paginated list. Query params mirror the current UI state in `Customers.jsx`:

| param | values | maps to |
|---|---|---|
| `search` | string | name / email / country search |
| `status` | `all` `active` `churned` | status chips |
| `sort` | `name` `plan` `mrr` `country` `status` `signup` | sortable columns |
| `dir` | `asc` `desc` | sort arrow |
| `page` | int | pagination |

```jsonc
{ "data": [{ "id": 12, "name": "North Labs", "email": "…", "country": "United States",
             "plan": { "id": "scale", "name": "Scale" }, "mrr": 299,
             "status": "active", "signedUpAt": "2025-03-04" }],
  "meta": { "total": 412, "perPage": 40, "currentPage": 1 } }
```

### `GET /api/customers/{id}`
Detail view → `CustomerDetail.jsx` (timeline + payment history).
```jsonc
{ "id": 12, "name": "North Labs", "email": "…", "country": "United States",
  "status": "active", "plan": { "id": "scale", "name": "Scale" },
  "currentMrr": 299, "lifetimePaid": 3588, "signedUpAt": "2025-03-04",
  "timeline": [{ "type": "expansion", "fromPlan": "Growth", "toPlan": "Scale",
                 "date": "2025-09-12" }],
  "invoices": [{ "amount": 299, "status": "paid", "date": "2026-06-04",
                 "isRetry": false }] }
```

## Subscriptions (lifecycle)

These power the working actions in `Subscriptions.jsx` / the modals. Each mutates
`subscriptions` + appends a `subscription_event`, so the next `/api/metrics` call
reflects the change (matching today's live-updating behaviour).

### `GET /api/subscriptions`
Active subscriptions list. Query `plan` (`all` or a plan slug) → plan filter chips.

### `POST /api/subscriptions`  — new subscription
Body: `{ "name": "Acme Inc.", "plan": "growth" }` → creates customer +
subscription + first invoice + `new` event. Replaces `doNewSub()`.

### `PATCH /api/subscriptions/{id}`  — change plan
Body: `{ "plan": "scale" }` → updates plan, appends `expansion`/`contraction`
event (reactivates if canceled). Replaces `doChangePlan()`.

### `DELETE /api/subscriptions/{id}`  — cancel
Sets status `canceled`, appends `churn` event. Replaces `doCancel()`.

## Auth (Laravel Sanctum, SPA cookie auth)

Scaffolded in the structure step; routes stay public until login is built.

| method | path | purpose |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | CSRF init for the SPA |
| POST | `/api/login` | authenticate |
| POST | `/api/logout` | end session |
| GET | `/api/user` | current user (→ sidebar profile) |

## Endpoint → frontend map (summary)

| frontend file | endpoint(s) |
|---|---|
| `pages/Dashboard.jsx` | `GET /api/metrics`, `GET /api/plans` |
| `pages/Insights.jsx` | `GET /api/metrics` |
| `pages/Customers.jsx` | `GET /api/customers` |
| `pages/CustomerDetail.jsx` | `GET /api/customers/{id}` |
| `pages/Plans.jsx` | `GET /api/plans`, `GET /api/metrics` |
| `pages/Subscriptions.jsx` | `GET/POST/PATCH/DELETE /api/subscriptions` |
| `components/Sidebar.jsx` | `GET /api/user` |
