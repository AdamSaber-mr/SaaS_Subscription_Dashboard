# Revenue OS — SaaS Revenue Dashboard

A Stripe/Mercury-style SaaS revenue dashboard. **Monorepo** with a React + Vite
frontend and a Laravel API backend.

```
SaaS-Dashboard/
├── frontend/   # React + Vite SPA (see frontend section below)
└── backend/    # Laravel 13 API (Sanctum token auth, SQLite, event-sourced metrics)
```

> **Status:** fully wired. The frontend authenticates against the Laravel API
> and reads all data from it; the old in-browser simulation
> (`src/lib/engine.js`) has been removed — its generator lives on as the
> backend's `DemoDataSeeder` (bit-identical dataset, same seeded RNG).

## Getting started

```bash
# backend — http://localhost:8000
cd backend
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed        # plans + demo user + 18-month demo dataset
php artisan serve

# frontend — http://localhost:5173
cd frontend
npm install
npm run dev
```

Sign in with the demo account: **ava@northwind.test** / **password**.

## Features

- **Dashboard** — KPI cards (MRR, ARR, active customers, net new MRR) with
  count-up animations and sparklines; MRR trend & active-customers charts
  (ApexCharts); MRR movements in three views (**Chart / Flow / Breakdown**);
  secondary metrics (NRR, quick ratio, ARPU, LTV, churn); cohort retention grid.
- **Insights** — plain-language summary cards derived from the data.
- **Customers** — searchable, sortable, filterable list → detail view with
  subscription timeline and payment history.
- **Plans** — adoption and revenue contribution per tier.
- **Subscriptions** — lifecycle actions (new / change plan / cancel) that update
  the current-period metrics live.
- **Light / dark theme** toggle, period filter (this month / last month /
  last quarter / 12 months), `prefers-reduced-motion` support, tabular numbers.

## Frontend structure

```
frontend/src/
├── main.jsx                  # entry — mounts <App> inside <DashboardProvider>
├── App.jsx                   # shell: login gate + theme root + sidebar + route switch
├── index.css                 # globals, scrollbar, entrance keyframes, Apex overrides
├── lib/
│   ├── api.js                # JSON client (token in localStorage, 401 → login)
│   ├── periods.js            # period filter options
│   ├── badges.js             # shared plan/status badge styles
│   ├── format.js             # currency / percent / date / sparkline / avatar helpers
│   └── theme.js              # light & dark design tokens, chart colours, font
├── store/
│   └── DashboardContext.jsx  # auth + server data (fetch/refetch) + UI state + actions
├── hooks/
│   ├── useCountUp.js         # rAF count-up that writes to the DOM (no re-render storm)
│   └── usePeriodMetrics.js   # adapts /api/metrics payload to flat page metrics
├── components/
│   ├── Sidebar.jsx  Topbar.jsx  Modal.jsx
│   ├── KpiCard.jsx  SegToggle.jsx  InfoTip.jsx
│   └── charts/
│       ├── MrrTrendChart.jsx        # ApexCharts area
│       ├── ActiveCustomersChart.jsx # ApexCharts bar
│       ├── MovementsChart.jsx       # ApexCharts diverging bars
│       ├── FlowChart.jsx            # custom SVG Sankey
│       └── CohortGrid.jsx           # retention heat-grid
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx  Insights.jsx
    ├── Customers.jsx  CustomerDetail.jsx
    ├── Plans.jsx      Subscriptions.jsx
```

### How state & data flow

`DashboardProvider` (React Context) owns auth (Sanctum token), all UI state
(route, period, theme, filters, modal, …) and the server data. Effects fetch
`/api/metrics`, `/api/customers` (server-side search/sort/pagination),
`/api/customers/{id}`, `/api/subscriptions` and `/api/plans`; lifecycle
actions POST/PATCH/DELETE and then refetch, so every page updates live.

## Backend (Laravel)

Laravel 13 API under `backend/` — see `backend/docs/` for the data model and
endpoint contract. Highlights:

- **Event-sourced metrics**: every lifecycle change appends a
  `subscription_events` row with a signed `mrr_delta_cents`;
  `MetricsService` aggregates the log into KPIs, movements, trend, cohort
  retention and plan mix per period.
- **`DemoDataSeeder`** is a bit-exact PHP port of the old frontend generator
  (same mulberry32 seed), ending at the current month.
- **Auth**: Sanctum bearer tokens (`POST /api/login`), all data routes behind
  `auth:sanctum`, login throttled, tokens expire after a week. CORS is
  configured for the Vite origin (`FRONTEND_URL` in `.env`).

## Notes

- Churn is shown as an **average monthly rate**, not literal "lost ÷ start",
  which explodes over a growing 12-month base.
- All metrics are derived from one event log, so they agree with each other
  (ARR = MRR×12, net MRR = new + expansion − contraction − churn, LTV = ARPU ÷
  monthly churn, …).
