import { useState } from 'react'
import { Mail, Plus, Trash2, Loader2, Download, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { emailAPI } from '../services/api'

export default function EmailPage() {
  const [urls, setUrls] = useState([''])
  const [extracting, setExtracting] = useState(false)
  const [results, setResults] = useState(null)
  const [copied, setCopied] = useState(false)

  const addUrl = () => {
    if (urls.length < 50) {
      setUrls([...urls, ''])
    }
  }

  const removeUrl = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index, value) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleExtract = async () => {
    const validUrls = urls.filter(url => url.trim().length > 0)
    if (validUrls.length === 0) {
      toast.error('Please enter at least one URL')
      return
    }

    setExtracting(true)
    setResults(null)

    try {
      const response = await emailAPI.extractBatch(validUrls)
      setResults(response.data)
      if (response.data.unique_emails?.length > 0) {
        toast.success(`Found ${response.data.unique_emails.length} unique emails`)
      } else {
        toast.success('Extraction complete. No emails found.')
      }
    } catch (err) {
      toast.error('Failed to extract emails. Make sure the email service is running.')
    } finally {
      setExtracting(false)
    }
  }

  const copyEmails = async () => {
    if (results?.unique_emails?.length > 0) {
      await navigator.clipboard.writeText(results.unique_emails.join('\n'))
      setCopied(true)
      toast.success('Emails copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadEmails = () => {
    if (results?.unique_emails?.length > 0) {
      const blob = new Blob([results.unique_emails.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'emails.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Extraction</h1>
        <p className="text-gray-600 mt-1">
          Extract email addresses from websites using AI-powered crawling
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Website URLs (max 50)
            </label>
            <button
              onClick={addUrl}
              disabled={urls.length >= 50}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              <Plus size={16} />
              Add URL
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {urls.length > 1 && (
                  <button
                    onClick={() => removeUrl(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {extracting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Extracting emails...
              </>
            ) : (
              <>
                <Mail size={20} />
                Extract Emails
              </>
            )}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Results ({results.unique_emails?.length || 0} unique emails)
            </h2>
            {results.unique_emails?.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={copyEmails}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy All'}
                </button>
                <button
                  onClick={downloadEmails}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            )}
          </div>

          {results.unique_emails?.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {results.unique_emails.map((email, idx) => (
                <a
                  key={idx}
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-gray-100"
                >
                  <Mail size={14} className="text-green-600" />
                  {email}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No emails found in the provided URLs
            </p>
          )}

          {results.results?.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Detailed Results</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.results.map((result, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      result.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-600">{result.url}</p>
                      {result.emails?.length > 0 && (
                        <p className="text-green-600">{result.emails.length} email(s) found</p>
                      )}
                      {result.error && (
                        <p className="text-red-500 text-xs">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
