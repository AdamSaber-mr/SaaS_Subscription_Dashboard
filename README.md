# Revenue OS — SaaS Revenue Dashboard

A Stripe/Mercury-style SaaS revenue dashboard. **Monorepo** with a React + Vite
frontend and (soon) a Laravel API backend.

```
SaaS-Dashboard/
├── frontend/   # React + Vite SPA (built — see frontend section below)
└── backend/    # Laravel API (placeholder — not scaffolded yet)
```

> **Status:** frontend is built; data is simulated in the browser. The
> **Laravel** backend in `backend/` will replace the data layer later
> (see [Backend](#backend-laravel-later)).

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

## Getting started (frontend)

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → frontend/dist/
npm run preview  # preview the production build
```

## Frontend structure

```
frontend/src/
├── main.jsx                  # entry — mounts <App> inside <DashboardProvider>
├── App.jsx                   # shell: theme root + sidebar + topbar + route switch
├── index.css                 # globals, scrollbar, entrance keyframes, Apex overrides
├── lib/
│   ├── engine.js             # simulated data: plans, generation, aggregates, period metrics
│   ├── format.js             # currency / percent / sparkline / avatar helpers
│   └── theme.js              # light & dark design tokens, chart colours, font
├── store/
│   └── DashboardContext.jsx  # all UI state + lifecycle actions (single source of truth)
├── hooks/
│   ├── useCountUp.js         # rAF count-up that writes to the DOM (no re-render storm)
│   └── usePeriodMetrics.js   # memoised period metrics from aggregates
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
    ├── Dashboard.jsx  Insights.jsx
    ├── Customers.jsx  CustomerDetail.jsx
    ├── Plans.jsx      Subscriptions.jsx
```

### How state & data flow

`DashboardProvider` (React Context) holds **all** UI state (route, period, theme,
filters, modal, …) and owns the dataset. The dataset is generated once into a
ref; lifecycle actions mutate it in place and bump a version counter, which
re-derives `aggregates` via `useMemo`. Pages read state with the `useDashboard`
hook and compute their view models locally — no prop-drilling.

## Backend (Laravel, later)

The UI talks to the simulated engine only through `src/lib/engine.js` and the
`customers` array in `DashboardContext`. To wire up the real backend:

1. Build Laravel API endpoints that return customers / events / invoices in the
   same shape `generateData()` produces.
2. In `DashboardContext`, replace the `generateData()` call with a fetch to the
   API (e.g. load into state on mount).
3. Point the lifecycle actions (`doChangePlan`, `doCancel`, `doNewSub`) at the
   corresponding API mutations instead of mutating the local array.

The rest of the UI — `aggregates`, `periodMetrics`, charts and pages — stays
unchanged.

## Notes

- Churn is shown as an **average monthly rate**, not literal "lost ÷ start",
  which explodes over a growing 12-month base.
- All metrics are derived from one event log, so they agree with each other
  (ARR = MRR×12, net MRR = new + expansion − contraction − churn, LTV = ARPU ÷
  monthly churn, …).
