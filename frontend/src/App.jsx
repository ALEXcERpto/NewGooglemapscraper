import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/SearchPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import EmailPage from './pages/EmailPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/results/:searchId" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/email" element={<EmailPage />} />
      </Routes>
    </Layout>
  )
}

export default App
