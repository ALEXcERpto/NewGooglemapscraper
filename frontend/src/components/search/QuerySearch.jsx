import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchStore } from '../../store/searchStore'
import ProgressBar from '../common/ProgressBar'

export default function QuerySearch() {
  const navigate = useNavigate()
  const { searchByQuery, isLoading, progress, error } = useSearchStore()

  const [query, setQuery] = useState('')
  const [options, setOptions] = useState({
    limit: 1000,
    country: 'us',
    language: 'en'
  })
  const [customLimit, setCustomLimit] = useState('')

  // Cost estimation: $2 per 10,000 requests, ~20 results per request
  const estimatedCalls = Math.ceil(options.limit / 20)
  const estimatedCost = ((estimatedCalls / 10000) * 2).toFixed(4)

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    try {
      const result = await searchByQuery({ query, ...options })
      toast.success(`Found ${result.resultCount} results`)
      navigate(`/results/${result.searchId}`)
    } catch (err) {
      toast.error(err.friendlyMessage || 'Search failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Query
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., restaurants in NYC, plumbers 10001, coffee shops near Times Square"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search size={20} />
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Result Limit
          </label>
          <select
            value={options.limit}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'custom') {
                setCustomLimit(options.limit.toString())
              } else {
                setOptions({ ...options, limit: parseInt(val) })
                setCustomLimit('')
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value={100}>100 results</option>
            <option value={500}>500 results</option>
            <option value={1000}>1,000 results</option>
            <option value={5000}>5,000 results</option>
            <option value={10000}>10,000 results</option>
            <option value={25000}>25,000 results</option>
            <option value={50000}>50,000 results</option>
            <option value={100000}>100,000 results</option>
            <option value="custom">Custom...</option>
          </select>
          {customLimit !== '' && (
            <input
              type="number"
              value={customLimit}
              onChange={(e) => {
                setCustomLimit(e.target.value)
                const val = parseInt(e.target.value) || 100
                setOptions({ ...options, limit: Math.min(val, 100000) })
              }}
              placeholder="Enter limit (max 100,000)"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="100000"
              disabled={isLoading}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={options.country}
            onChange={(e) => setOptions({ ...options, country: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
            <option value="au">Australia</option>
            <option value="de">Germany</option>
            <option value="fr">France</option>
            <option value="in">India</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={options.language}
            onChange={(e) => setOptions({ ...options, language: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <ProgressBar progress={progress} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
