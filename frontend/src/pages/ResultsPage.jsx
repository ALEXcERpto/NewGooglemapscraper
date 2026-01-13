import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Save, Star, Phone, Globe, MapPin, Filter, ArrowLeft, Mail, Loader2, Copy, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchAPI, exportAPI, historyAPI, emailAPI } from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'

export default function ResultsPage() {
  const { searchId } = useParams()
  const navigate = useNavigate()

  const [search, setSearch] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [extractingEmails, setExtractingEmails] = useState(false)
  const [extractingRowId, setExtractingRowId] = useState(null)
  const [emailSectionOpen, setEmailSectionOpen] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0 })
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [filters, setFilters] = useState({
    minRating: 0,
    hasPhone: false,
    hasWebsite: false,
    hasEmail: false,
    searchText: ''
  })

  useEffect(() => {
    loadResults()
  }, [searchId])

  const loadResults = async () => {
    try {
      const response = await searchAPI.getResults(searchId)
      setSearch(response.data.search)
      setResults(response.data.results)
    } catch (err) {
      toast.error('Failed to load results')
      navigate('/history')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const response = await exportAPI.create(searchId, format)
      const blob = await exportAPI.download(response.data.jobId)

      const url = window.URL.createObjectURL(blob.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `results_${searchId}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Exported ${response.data.recordCount} records`)
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.error('Please enter a name')
      return
    }
    try {
      await historyAPI.save(searchId, saveName.trim())
      toast.success('Search saved')
      setSaveModalOpen(false)
      loadResults()
    } catch (err) {
      toast.error('Failed to save')
    }
  }

  const handleExtractEmails = async () => {
    const websitesCount = results.filter(r => r.website).length
    if (websitesCount === 0) {
      toast.error('No websites found in results')
      return
    }

    setExtractingEmails(true)
    setExtractionProgress({ current: 0, total: websitesCount })
    try {
      const response = await emailAPI.extractFromSearch(searchId)
      toast.success(`Found ${response.data.uniqueEmails?.length || 0} unique emails from ${response.data.websitesProcessed} websites`)
      setEmailSectionOpen(true)
      loadResults() // Reload to show updated emails
    } catch (err) {
      toast.error('Failed to extract emails. Make sure the email service is running.')
    } finally {
      setExtractingEmails(false)
      setExtractionProgress({ current: 0, total: 0 })
    }
  }

  const handleExtractSingleEmail = async (result) => {
    if (!result.website) {
      toast.error('No website available for this business')
      return
    }

    setExtractingRowId(result.id)
    try {
      const response = await emailAPI.extractBatch([result.website])
      const emails = response.data.results?.[0]?.emails || []

      if (emails.length > 0) {
        // Update local state immediately
        setResults(prev => prev.map(r =>
          r.id === result.id ? { ...r, emails } : r
        ))
        toast.success(`Found ${emails.length} email(s)`)
      } else {
        toast.info('No emails found on this website')
      }
    } catch (err) {
      toast.error('Failed to extract emails')
    } finally {
      setExtractingRowId(null)
    }
  }

  // Get all unique emails from results
  const allEmails = [...new Set(results.flatMap(r => r.emails || []))]
  const resultsWithEmails = results.filter(r => r.emails && r.emails.length > 0).length
  const resultsWithWebsites = results.filter(r => r.website).length

  const copyAllEmails = () => {
    if (allEmails.length === 0) {
      toast.error('No emails to copy')
      return
    }
    navigator.clipboard.writeText(allEmails.join('\n'))
    toast.success(`Copied ${allEmails.length} emails to clipboard`)
  }

  const downloadEmails = () => {
    if (allEmails.length === 0) {
      toast.error('No emails to download')
      return
    }
    const blob = new Blob([allEmails.join('\n')], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emails_${searchId}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`Downloaded ${allEmails.length} emails`)
  }

  const filteredResults = results.filter(r => {
    if (filters.minRating && (r.rating || 0) < filters.minRating) return false
    if (filters.hasPhone && !r.phone) return false
    if (filters.hasWebsite && !r.website) return false
    if (filters.hasEmail && (!r.emails || r.emails.length === 0)) return false
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase()
      const name = (r.name || '').toLowerCase()
      const address = (r.address || '').toLowerCase()
      if (!name.includes(search) && !address.includes(search)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading results..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {search?.name || search?.query || 'Search Results'}
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredResults.length} of {results.length} results
          </p>
        </div>

        <div className="flex gap-3">
          {!search?.is_saved && (
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Save size={18} />
              Save
            </button>
          )}

          <div className="relative group">
            <button
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download size={18} />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg hidden group-hover:block z-10">
              <button
                onClick={() => handleExport('csv')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Export as JSON
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-500" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search in results..."
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            className="px-3 py-2 border rounded-lg w-64"
          />
          <select
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value={0}>Any rating</option>
            <option value={3}>3+ stars</option>
            <option value={4}>4+ stars</option>
            <option value={4.5}>4.5+ stars</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.hasPhone}
              onChange={(e) => setFilters({ ...filters, hasPhone: e.target.checked })}
              className="rounded"
            />
            Has phone
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.hasWebsite}
              onChange={(e) => setFilters({ ...filters, hasWebsite: e.target.checked })}
              className="rounded"
            />
            Has website
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.hasEmail}
              onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })}
              className="rounded"
            />
            Has email
          </label>
        </div>
      </div>

      {/* Email Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setEmailSectionOpen(!emailSectionOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="text-green-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Email Extraction</h3>
              <p className="text-sm text-gray-500">
                {allEmails.length} unique emails found from {resultsWithEmails} businesses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {extractingEmails && (
              <div className="flex items-center gap-2 text-green-600">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Extracting from {extractionProgress.total} websites...</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">{resultsWithWebsites} with websites</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{resultsWithEmails} with emails</span>
            </div>
            {emailSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {emailSectionOpen && (
          <div className="border-t border-gray-200 p-6">
            {/* Email Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={handleExtractEmails}
                  disabled={extractingEmails || resultsWithWebsites === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {extractingEmails ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Extract All Emails
                    </>
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyAllEmails}
                  disabled={allEmails.length === 0}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy size={16} />
                  Copy All ({allEmails.length})
                </button>
                <button
                  onClick={downloadEmails}
                  disabled={allEmails.length === 0}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  Download .txt
                </button>
              </div>
            </div>

            {/* Email List */}
            {allEmails.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {allEmails.map((email, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200 group"
                    >
                      <a
                        href={`mailto:${email}`}
                        className="text-sm text-green-600 hover:underline truncate flex-1"
                      >
                        {email}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(email)
                          toast.success('Email copied')
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail size={40} className="mx-auto mb-3 text-gray-300" />
                <p>No emails extracted yet</p>
                <p className="text-sm mt-1">Click "Extract All Emails" to crawl websites for email addresses</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Rating</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Reviews</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResults.map((result, idx) => (
                <tr key={result.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{result.name}</div>
                    {result.types && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Array.isArray(result.types) ? result.types.slice(0, 2).join(', ') : result.types}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {result.address}
                  </td>
                  <td className="px-4 py-3">
                    {result.phone ? (
                      <a href={`tel:${result.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Phone size={14} />
                        {result.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {result.emails && result.emails.length > 0 ? (
                      <div className="space-y-1">
                        {result.emails.slice(0, 2).map((email, i) => (
                          <a
                            key={i}
                            href={`mailto:${email}`}
                            className="text-green-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            <Mail size={12} />
                            {email}
                          </a>
                        ))}
                        {result.emails.length > 2 && (
                          <span className="text-xs text-gray-500">+{result.emails.length - 2} more</span>
                        )}
                      </div>
                    ) : result.website ? (
                      <button
                        onClick={() => handleExtractSingleEmail(result)}
                        disabled={extractingRowId === result.id}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50 flex items-center gap-1"
                      >
                        {extractingRowId === result.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Mail size={12} />
                            Extract
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">No website</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {result.rating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        {result.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {result.review_count?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {result.website ? (
                      <a
                        href={result.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Globe size={14} />
                        Visit
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No results match your filters
          </div>
        )}
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Search"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name this search
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g., NYC Restaurants, LA Coffee Shops"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setSaveModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
