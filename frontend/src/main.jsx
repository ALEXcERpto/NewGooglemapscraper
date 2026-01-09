import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import App from './App'
import './index.css'

console.log('🚀 App starting...')
console.log('API URL:', import.meta.env.VITE_API_URL || '/api (default)')

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('❌ Failed to render app:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Failed to load app</h1>
      <pre>${error.message}</pre>
    </div>
  `
}
