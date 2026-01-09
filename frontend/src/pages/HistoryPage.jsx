import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, RefreshCw, Eye, Calendar, MapPin, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHistoryStore } from '../store/historyStore'
import { useSearchStore } from '../store/searchStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { searches, isLoading, pagination, fetchHistory, deleteSearch, getRerunParams } = useHistoryStore()
  const { searchByQuery, searchByCoordinates } = useSearchStore()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedSearch, setSelectedSearch] = useState(null)
  const [filter, setFilter] = useState('all') // all, saved

  useEffect(() => {
    fetchHistory(1, filter === 'saved')
  }, [filter])

  const handleDelete = async () => {
    if (!selectedSearch) return
    try {
      await deleteSearch(selectedSearch.id)
      toast.success('Search deleted')
      setDeleteModalOpen(false)
      setSelectedSearch(null)
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleRerun = async (search) => {
    try {
      const params = await getRerunParams(search.id)

      if (params.type === 'query') {
        const result = await searchByQuery(params.parameters)
        navigate(`/results/${result.searchId}`)
      } else {
        const result = await searchByCoordinates(params.parameters)
        navigate(`/results/${result.searchId}`)
      }

      toast.success('Search re-run successfully')
    } catch (err) {
      toast.error('Failed to re-run search')
    }
  }

  if (isLoading && searches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading history..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search History</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} total searches
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('saved')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'saved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Saved Only
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {searches.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {searches.map(search => (
              <div
                key={search.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
              >
                <div className={`p-2 rounded-lg ${
                  search.type === 'query' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {search.type === 'query' ? (
                    <Search className="text-blue-600" size={20} />
                  ) : (
                    <MapPin className="text-green-600" size={20} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {search.name || search.query || 'Coordinate Search'}
                    </p>
                    {search.is_saved === 1 && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(search.created_at).toLocaleDateString()}
                    </span>
                    <span>{search.result_count} results</span>
                    <span>{search.api_calls_used} API calls</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/results/${search.id}`}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View results"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => handleRerun(search)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    title="Re-run search"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSearch(search)
                      setDeleteModalOpen(true)
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No searches found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchHistory(page, filter === 'saved')}
              className={`px-4 py-2 rounded-lg ${
                pagination.page === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedSearch(null)
        }}
        title="Delete Search"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this search? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedSearch(null)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
