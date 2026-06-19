# Backend design — 1. Data model

The Laravel backend replaces the in-browser data engine
(`frontend/src/lib/engine.js`). This document defines the persisted schema that
produces the **same shapes** the frontend already consumes, so the UI keeps
working once the API is wired in.

> Money is stored in **integer cents** (`*_cents`) to avoid float rounding.
> API resources convert to whole-dollar numbers for the frontend, which already
> formats with its own `usd()` / `usdShort()` helpers.

## Entity overview

```
plans 1───* subscriptions *───1 customers
                  │ 1                 │ 1
                  │                   │
                  *                   *
        subscription_events       invoices
```

- A **customer** has one **subscription** (their current plan state).
- A subscription accumulates **subscription_events** (the lifecycle log:
  new / upgrade / downgrade / cancel) — this is the source of truth all metrics
  are derived from.
- A customer has many **invoices** (billing history).
- **plans** is reference data (the four tiers).

## Tables

### `plans`
Reference data for the subscription tiers. Mirrors the `PLANS` array in `engine.js`.

| column | type | notes |
|---|---|---|
| id | bigint PK | |
| slug | string, unique | `starter` `growth` `scale` `enterprise` — the `planId` the frontend uses |
| name | string | "Starter", "Growth", … |
| blurb | string | short description shown on the Plans page |
| price_cents | unsigned int | sticker price (e.g. Enterprise = 1198800) |
| interval | enum(`month`,`year`) | billing interval |
| mrr_cents | unsigned int | normalised monthly value (Enterprise year → 99900) |
| ramp_color | string(7) | hex for charts, mirrors `PLAN_RAMP` |
| sort_order | unsigned tinyint | ladder order (Starter→Enterprise) |
| is_active | boolean, default true | hide retired plans without deleting |
| timestamps | | |

### `customers`
The account identity. Status/plan are derived from the subscription but cached
here for fast list queries.

| column | type | notes |
|---|---|---|
| id | bigint PK | |
| name | string | company name |
| email | string, unique | `billing@…` |
| country | string | display name |
| country_code | string(2) | ISO-2 (`US`, `NL`, …) |
| signed_up_at | date | first subscription date |
| timestamps | | |

### `subscriptions`
The customer's current subscription record. Plan changes mutate `plan_id` and
append a `subscription_event`.

| column | type | notes |
|---|---|---|
| id | bigint PK | |
| customer_id | bigint FK → customers, unique | one current subscription per customer |
| plan_id | bigint FK → plans | current plan |
| status | enum(`active`,`canceled`) | |
| billing_interval | enum(`month`,`year`) | copied from plan at signup |
| started_at | date | |
| canceled_at | date, nullable | set when churned |
| timestamps | | |

### `subscription_events`
The immutable lifecycle log — **the engine's `events` array, persisted.**
Every KPI and chart is aggregated from this table.

| column | type | notes |
|---|---|---|
| id | bigint PK | |
| subscription_id | bigint FK → subscriptions | |
| customer_id | bigint FK → customers | denormalised for fast grouping |
| type | enum(`new`,`expansion`,`contraction`,`churn`) | |
| from_plan_id | bigint FK → plans, nullable | set on upgrade/downgrade |
| to_plan_id | bigint FK → plans, nullable | the resulting plan (null on churn) |
| mrr_delta_cents | int (signed) | + for new/expansion, − for contraction/churn |
| occurred_at | date | event date |
| timestamps | | |

### `invoices`
Billing history shown on the customer detail page.

| column | type | notes |
|---|---|---|
| id | bigint PK | |
| customer_id | bigint FK → customers | |
| subscription_id | bigint FK → subscriptions | |
| plan_id | bigint FK → plans | plan billed |
| amount_cents | unsigned int | |
| status | enum(`paid`,`failed`,`refunded`) | |
| issued_at | date | |
| is_retry | boolean, default false | the auto-retry after a failed charge |
| timestamps | | |

## Mapping to the current frontend shapes

The frontend works in **month indices** (0 = Jan 2025 … 17 = Jun 2026). The
backend stores **real dates**; API resources expose real `*_at` dates, and the
month-index math moves server-side into the metrics service (see doc 2 & the
`aggregates()` / `periodMetrics()` functions being ported).

| frontend (`engine.js`) | backend source |
|---|---|
| `PLANS`, `PLAN_RAMP` | `plans` table |
| customer `{ id, name, email, country, cc, status, planId }` | `customers` + current `subscriptions` |
| customer `events[]` | `subscription_events` |
| customer `invoices[]` | `invoices` |
| `aggregates(cs)` | `MetricsService` (server-side) |
| `periodMetrics(A, period)` | `MetricsService::forPeriod()` |
| `generateData()` | `DemoDataSeeder` (PHP port of the seeded RNG) |

## Open questions (decide before migrations)

- **Auth scope** — add a `users` table + Sanctum now, or after the API works?
  (Default plan: add it in the structure step but keep routes public until login
  is built.)
- **Dev database** — SQLite (already on the machine, zero-config) unless you
  want MySQL/Postgres to match production.
- **Multi-tenancy** — out of scope for the prototype; single-org assumed.
