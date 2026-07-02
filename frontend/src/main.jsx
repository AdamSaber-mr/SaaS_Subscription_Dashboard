import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { DashboardProvider } from './store/DashboardContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <DashboardProvider>
          <App />
        </DashboardProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
