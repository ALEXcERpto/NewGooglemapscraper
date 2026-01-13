import axios from 'axios'

// Use environment variable for API URL, fallback to /api for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for long searches
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject({ ...error, friendlyMessage: message })
  }
)

// Search API
export const searchAPI = {
  querySearch: (params) => api.post('/search/query', params),
  coordinateSearch: (params) => api.post('/search/coordinates', params),
  getResults: (searchId, params) => api.get(`/search/${searchId}/results`, { params }),
  estimateCost: (params) => api.post('/search/estimate', params)
}

// History API
export const historyAPI = {
  getAll: (params) => api.get('/history', { params }),
  getOne: (id) => api.get(`/history/${id}`),
  save: (id, name) => api.post(`/history/${id}/save`, { name }),
  update: (id, data) => api.put(`/history/${id}`, data),
  delete: (id) => api.delete(`/history/${id}`),
  rerun: (id) => api.post(`/history/${id}/rerun`)
}

// Export API
export const exportAPI = {
  create: (searchId, format) => api.post('/export', { searchId, format }),
  getStatus: (jobId) => api.get(`/export/${jobId}/status`),
  download: (jobId) => api.get(`/export/${jobId}/download`, { responseType: 'blob' })
}

// Place API
export const placeAPI = {
  getDetails: (placeId, params) => api.get(`/place/${placeId}`, { params }),
  getReviews: (placeId, params) => api.get(`/place/${placeId}/reviews`, { params }),
  getPhotos: (placeId, params) => api.get(`/place/${placeId}/photos`, { params })
}

// Email API
export const emailAPI = {
  extractFromUrl: (url) => api.post('/email/extract', { url }),
  extractFromSearch: (searchId) => api.post(`/email/search/${searchId}/extract`),
  extractBatch: (urls) => api.post('/email/extract/batch', { urls }),
  healthCheck: () => api.get('/email/health')
}

export default api
