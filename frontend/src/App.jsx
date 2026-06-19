import { useDashboard } from './store/DashboardContext.jsx'
import { rootStyle } from './lib/theme.js'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Modal from './components/Modal.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Insights from './pages/Insights.jsx'
import Customers from './pages/Customers.jsx'
import CustomerDetail from './pages/CustomerDetail.jsx'
import Plans from './pages/Plans.jsx'
import Subscriptions from './pages/Subscriptions.jsx'

const PAGES = {
  dashboard: Dashboard,
  insights: Insights,
  customers: Customers,
  detail: CustomerDetail,
  plans: Plans,
  subscriptions: Subscriptions,
}

export default function App() {
  const { route, theme, accent } = useDashboard()
  const Page = PAGES[route] || Dashboard

  return (
    <div style={rootStyle(theme, accent)}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        {/* keyed by route so entrance animations replay on navigation */}
        <div key={route} style={{ flex: 1, padding: '26px 30px 60px' }}>
          <Page />
        </div>
      </main>
      <Modal />
    </div>
  )
}
