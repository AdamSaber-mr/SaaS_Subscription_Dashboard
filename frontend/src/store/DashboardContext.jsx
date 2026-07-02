import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, getToken, setToken, clearToken } from '../lib/api.js'

const DashboardContext = createContext(null)

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>')
  return ctx
}

const store = {
  get: (key, fallback) => localStorage.getItem('revenue-os.' + key) || fallback,
  set: (key, value) => localStorage.setItem('revenue-os.' + key, value),
}

export function DashboardProvider({ children }) {
  // --- auth ------------------------------------------------------------------
  const [user, setUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(!!getToken())

  useEffect(() => {
    if (!getToken()) return
    api
      .get('/user')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setAuthChecking(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/login', { email, password })
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // token may already be invalid — clearing locally is what matters
    }
    clearToken()
    setUser(null)
  }, [])

  // --- routing (URL is the source of truth) ----------------------------------
  const location = useLocation()
  const navigate = useNavigate()
  const detailMatch = location.pathname.match(/^\/customers\/(\d+)$/)
  const selectedCustomerId = detailMatch ? Number(detailMatch[1]) : null
  const route = detailMatch ? 'detail' : location.pathname.slice(1) || 'dashboard'

  // --- UI state ----------------------------------------------------------------
  const [period, setPeriodState] = useState(() => store.get('period', 'last_12'))
  const [theme, setTheme] = useState(() => store.get('theme', 'light'))
  const [movementViz, setMovementViz] = useState('bars')
  const [dashLayout, setDashLayout] = useState('spacious')
  const [search, setSearchState] = useState('')
  const [sortKey, setSortKey] = useState('mrr')
  const [sortDir, setSortDir] = useState('desc')
  const [statusFilter, setStatusFilterState] = useState('all')
  const [page, setPage] = useState(1)
  const [subPlanFilter, setSubPlanFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [modalForm, setModalForm] = useState({ name: '', planId: 'growth' })

  const accent = '#6E56CF'
  const companyName = 'Northwind'

  const setPeriod = useCallback((p) => {
    setPeriodState(p)
    store.set('period', p)
  }, [])
  const toggleTheme = useCallback(
    () =>
      setTheme((t) => {
        const next = t === 'light' ? 'dark' : 'light'
        store.set('theme', next)
        return next
      }),
    [],
  )

  // List-state setters reset pagination so filters apply from page 1.
  const setSearch = useCallback((q) => {
    setSearchState(q)
    setPage(1)
  }, [])
  const setStatusFilter = useCallback((f) => {
    setStatusFilterState(f)
    setPage(1)
  }, [])
  const toggleSort = useCallback((key) => {
    setSortDir((prevDir) => (sortKey === key && prevDir === 'desc' ? 'asc' : 'desc'))
    setSortKey(key)
    setPage(1)
  }, [sortKey])

  // --- server data ---------------------------------------------------------
  const [plans, setPlans] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [customerList, setCustomerList] = useState(null)
  const [customerDetail, setCustomerDetail] = useState(null)
  const [subscriptionList, setSubscriptionList] = useState(null)
  const [error, setError] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fail = useCallback((err) => {
    if (err.status === 401) {
      setUser(null)
      return
    }
    setError(err.message)
  }, [])

  // Plans — once per session.
  useEffect(() => {
    if (!user) return
    api.get('/plans').then((res) => setPlans(res.data)).catch(fail)
  }, [user, fail])

  // Metrics — per selected period; previous payload stays visible while loading.
  useEffect(() => {
    if (!user) return
    api.get('/metrics?period=' + period).then(setMetrics).catch(fail)
  }, [user, period, refreshKey, fail])

  // Customers list — server-side search/filter/sort/pagination (debounced search).
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => {
      const params = new URLSearchParams({ search, status: statusFilter, sort: sortKey, dir: sortDir, page: String(page) })
      api
        .get('/customers?' + params)
        .then((res) =>
          setCustomerList({
            items: res.data,
            total: res.meta.total,
            page: res.meta.current_page,
            lastPage: res.meta.last_page,
            perPage: res.meta.per_page,
          }),
        )
        .catch(fail)
    }, search ? 250 : 0)
    return () => clearTimeout(t)
  }, [user, search, statusFilter, sortKey, sortDir, page, refreshKey, fail])

  // Customer detail — when one is opened.
  useEffect(() => {
    if (!user || selectedCustomerId == null) return
    setCustomerDetail(null)
    api.get('/customers/' + selectedCustomerId).then((res) => setCustomerDetail(res.data)).catch(fail)
  }, [user, selectedCustomerId, refreshKey, fail])

  // Active subscriptions — per plan filter.
  useEffect(() => {
    if (!user) return
    api
      .get('/subscriptions?plan=' + subPlanFilter)
      .then((res) => setSubscriptionList({ items: res.data, total: res.meta.total }))
      .catch(fail)
  }, [user, subPlanFilter, refreshKey, fail])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // --- navigation -------------------------------------------------------------
  const go = useCallback((r) => navigate('/' + r), [navigate])
  const openCustomer = useCallback((id) => navigate('/customers/' + id), [navigate])

  // --- lifecycle actions (API mutations + refetch) ---------------------------
  const closeModal = useCallback(() => setModal(null), [])

  const runAction = useCallback(
    async (fn) => {
      setActionBusy(true)
      try {
        await fn()
        setModal(null)
        refresh()
      } catch (err) {
        fail(err)
        setModal(null)
      } finally {
        setActionBusy(false)
      }
    },
    [refresh, fail],
  )

  const doNewSub = useCallback(() => {
    const name = (modalForm.name || '').trim() || 'New Customer'
    runAction(async () => {
      await api.post('/subscriptions', { name, plan: modalForm.planId })
      navigate('/subscriptions')
    })
  }, [modalForm, runAction, navigate])

  const doChangePlan = useCallback(() => {
    if (!modal?.subId) return
    runAction(() => api.patch('/subscriptions/' + modal.subId, { plan: modalForm.planId }))
  }, [modal, modalForm, runAction])

  const doCancel = useCallback(() => {
    if (!modal?.subId) return
    runAction(() => api.del('/subscriptions/' + modal.subId))
  }, [modal, runAction])

  // Modal openers. target: { subId, name, planId, mrr }
  const openNewSub = useCallback(() => {
    setModalForm({ name: '', planId: 'growth' })
    setModal({ kind: 'new' })
  }, [])
  const openChangePlan = useCallback((target) => {
    setModalForm((f) => ({ ...f, planId: target.planId || 'growth' }))
    setModal({ kind: 'change', ...target })
  }, [])
  const openCancel = useCallback((target) => setModal({ kind: 'cancel', ...target }), [])

  // --- derived plan helpers -----------------------------------------------------
  const planMap = useMemo(() => Object.fromEntries((plans || []).map((p) => [p.id, p])), [plans])
  const planRamp = useMemo(() => Object.fromEntries((plans || []).map((p) => [p.id, p.rampColor])), [plans])
  const maxPlanMrr = useMemo(() => Math.max(1, ...(plans || []).map((p) => p.mrr)), [plans])

  const booted = !!(plans && metrics)

  const value = useMemo(
    () => ({
      // auth
      user, authChecking, login, logout,
      // data
      plans, planMap, planRamp, maxPlanMrr, metrics, customerList, customerDetail,
      subscriptionList, booted, error, setError, actionBusy,
      accent, companyName,
      // state
      route, period, theme, movementViz, dashLayout, search,
      sortKey, sortDir, statusFilter, page, subPlanFilter, selectedCustomerId,
      modal, modalForm,
      // setters
      setPeriod, setMovementViz, setDashLayout, setSearch,
      setStatusFilter, setPage, setSubPlanFilter, setModalForm,
      // actions
      go, openCustomer, toggleTheme, toggleSort,
      doChangePlan, doCancel, doNewSub,
      openNewSub, openChangePlan, openCancel, closeModal,
    }),
    [
      user, authChecking, login, logout,
      plans, planMap, planRamp, maxPlanMrr, metrics, customerList, customerDetail,
      subscriptionList, booted, error, actionBusy,
      route, period, theme, movementViz, dashLayout, search,
      sortKey, sortDir, statusFilter, page, subPlanFilter, selectedCustomerId,
      modal, modalForm,
      setPeriod, setSearch, setStatusFilter, toggleTheme, toggleSort,
      go, openCustomer, doChangePlan, doCancel, doNewSub,
      openNewSub, openChangePlan, openCancel, closeModal,
    ],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
