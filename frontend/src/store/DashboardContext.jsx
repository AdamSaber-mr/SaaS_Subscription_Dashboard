import { createContext, useContext, useMemo, useRef, useState, useCallback } from 'react'
import { generateData, aggregates, plan, N } from '../lib/engine.js'

const DashboardContext = createContext(null)

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>')
  return ctx
}

export function DashboardProvider({ children }) {
  // The simulated customer dataset. Mutated in place by lifecycle actions; a
  // version counter forces dependent memos to recompute. Swap this ref for real
  // API data once the Laravel backend exists.
  const customersRef = useRef(null)
  if (customersRef.current === null) customersRef.current = generateData()
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  // UI state
  const [route, setRoute] = useState('dashboard')
  const [period, setPeriod] = useState('last_12')
  const [theme, setTheme] = useState('light')
  const [movementViz, setMovementViz] = useState('bars')
  const [dashLayout, setDashLayout] = useState('spacious')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('mrr')
  const [sortDir, setSortDir] = useState('desc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subPlanFilter, setSubPlanFilter] = useState('all')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [modal, setModal] = useState(null)
  const [modalForm, setModalForm] = useState({ name: '', planId: 'growth' })

  // accent / brand are "props" in the prototype — kept as tweakable config here.
  const accent = '#6E56CF'
  const companyName = 'Northwind'

  // Navigation
  const go = useCallback((r) => {
    setRoute(r)
    if (r === 'customers') setSelectedCustomerId(null)
  }, [])
  const openCustomer = useCallback((id) => {
    setSelectedCustomerId(id)
    setRoute('detail')
  }, [])
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])
  const toggleSort = useCallback((key) => {
    setSortDir((prevDir) => (sortKey === key && prevDir === 'desc' ? 'asc' : 'desc'))
    setSortKey(key)
  }, [sortKey])

  // Subscription lifecycle actions (mutate dataset + bump version)
  const closeModal = useCallback(() => setModal(null), [])

  const doChangePlan = useCallback(
    (id, newPlanId) => {
      const c = customersRef.current.find((x) => x.id === id)
      if (!c) return
      const cur = plan(c.planId)
      const np = plan(newPlanId)
      if (c.planId === newPlanId) {
        setModal(null)
        return
      }
      const up = np.mrr > cur.mrr
      c.events.push({
        type: up ? 'expansion' : 'contraction',
        month: N - 1,
        fromPlan: c.planId,
        planId: newPlanId,
        mrr: np.mrr - cur.mrr,
        day: 14,
      })
      c.planId = newPlanId
      if (c.status !== 'active') {
        c.status = 'active'
        delete c.churnMonth
      }
      setModal(null)
      bump()
    },
    [bump],
  )

  const doCancel = useCallback(
    (id) => {
      const c = customersRef.current.find((x) => x.id === id)
      if (!c || c.status !== 'active') {
        setModal(null)
        return
      }
      c.status = 'churned'
      c.churnMonth = N - 1
      c.events.push({ type: 'churn', month: N - 1, planId: c.planId, mrr: -plan(c.planId).mrr, day: 14 })
      setModal(null)
      bump()
    },
    [bump],
  )

  const doNewSub = useCallback(() => {
    const f = modalForm
    const nm = (f.name || '').trim() || 'New Customer'
    const pid = f.planId
    const id = Math.max(...customersRef.current.map((c) => c.id)) + 1
    const c = {
      id,
      name: nm,
      email: 'billing@' + nm.toLowerCase().replace(/[^a-z]/g, '') + '.com',
      country: 'United States',
      cc: 'US',
      signupMonth: N - 1,
      signupDay: 14,
      planId: pid,
      status: 'active',
      events: [{ type: 'new', month: N - 1, planId: pid, mrr: plan(pid).mrr, day: 14 }],
      invoices: [{ month: N - 1, day: 14, amount: plan(pid).price, status: 'paid', planId: pid }],
    }
    customersRef.current.push(c)
    setModal(null)
    setRoute('subscriptions')
    bump()
  }, [modalForm, bump])

  // Modal openers
  const openNewSub = useCallback(() => {
    setModalForm({ name: '', planId: 'growth' })
    setModal({ kind: 'new' })
  }, [])
  const openChangePlan = useCallback((id, planId) => {
    setModalForm((f) => ({ ...f, planId: planId || 'growth' }))
    setModal({ kind: 'change', id })
  }, [])
  const openCancel = useCallback((id) => setModal({ kind: 'cancel', id }), [])

  // Recompute aggregates whenever the dataset version changes.
  const customers = customersRef.current
  const A = useMemo(() => aggregates(customers), [customers, version])

  const value = {
    // data
    customers,
    aggregates: A,
    version,
    accent,
    companyName,
    // state
    route, period, theme, movementViz, dashLayout, search,
    sortKey, sortDir, statusFilter, subPlanFilter, selectedCustomerId,
    modal, modalForm,
    // setters
    setRoute, setPeriod, setMovementViz, setDashLayout, setSearch,
    setStatusFilter, setSubPlanFilter, setModalForm,
    // actions
    go, openCustomer, toggleTheme, toggleSort,
    doChangePlan, doCancel, doNewSub,
    openNewSub, openChangePlan, openCancel, closeModal,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
