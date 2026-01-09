import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, History, Download, MapPin } from 'lucide-react'
import { historyAPI } from '../services/api'

export default function Dashboard() {
  const [recentSearches, setRecentSearches] = useState([])
  const [stats, setStats] = useState({ total: 0, saved: 0 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await historyAPI.getAll({ limit: 5 })
      setRecentSearches(response.data.searches)
      setStats({
        total: response.data.pagination.total,
        saved: response.data.searches.filter(s => s.is_saved).length
      })
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Google Maps Scraper</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/search"
          className="p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Search className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">New Search</h3>
          <p className="text-blue-100 mt-1">Search by query or coordinates</p>
        </Link>

        <Link
          to="/history"
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
        >
          <History className="w-8 h-8 mb-3 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">History</h3>
          <p className="text-gray-600 mt-1">{stats.total} searches total</p>
        </Link>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <Download className="w-8 h-8 mb-3 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Exports</h3>
          <p className="text-gray-600 mt-1">CSV, JSON, Excel formats</p>
        </div>
      </div>

      {/* Recent Searches */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Searches</h2>
          <Link to="/history" className="text-blue-600 hover:text-blue-700 text-sm">
            View all
          </Link>
        </div>

        {recentSearches.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentSearches.map(search => (
              <Link
                key={search.id}
                to={`/results/${search.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
              >
                <MapPin className="text-gray-400" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {search.name || search.query || 'Coordinate Search'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {search.result_count} results · {new Date(search.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  search.type === 'query'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {search.type}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No searches yet. Start by creating a new search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
