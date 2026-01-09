import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { searchAPI } from '../services/api'

export const useSearchStore = create(
  persist(
    (set, get) => ({
      // State
      currentSearch: null,
      results: [],
      isLoading: false,
      progress: { current: 0, total: 0, status: '' },
      error: null,
      filters: {
        minRating: 0,
        hasPhone: false,
        hasWebsite: false,
        searchText: ''
      },

      // Actions
      setCurrentSearch: (search) => set({ currentSearch: search }),

      startSearch: () => set({
        isLoading: true,
        error: null,
        results: [],
        progress: { current: 0, total: 100, status: 'Starting search...' }
      }),

      updateProgress: (progress) => set({ progress }),

      setResults: (results, searchId) => set({
        results,
        isLoading: false,
        currentSearch: { id: searchId },
        progress: { current: 100, total: 100, status: 'Complete' }
      }),

      setError: (error) => set({
        error,
        isLoading: false,
        progress: { current: 0, total: 0, status: '' }
      }),

      setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

      clearResults: () => set({
        results: [],
        currentSearch: null,
        error: null,
        progress: { current: 0, total: 0, status: '' }
      }),

      // Async actions
      searchByQuery: async (params) => {
        const { startSearch, setResults, setError, updateProgress } = get()
        startSearch()
        updateProgress({ current: 10, total: 100, status: 'Searching...' })

        try {
          const response = await searchAPI.querySearch(params)
          setResults(response.data.results, response.data.searchId)
          return response.data
        } catch (error) {
          setError(error.friendlyMessage || 'Search failed')
          throw error
        }
      },

      searchByCoordinates: async (params) => {
        const { startSearch, setResults, setError, updateProgress } = get()
        startSearch()
        const gridPoints = params.gridSize * params.gridSize
        updateProgress({ current: 0, total: gridPoints, status: 'Searching grid points...' })

        try {
          const response = await searchAPI.coordinateSearch(params)
          setResults(response.data.results, response.data.searchId)
          return response.data
        } catch (error) {
          setError(error.friendlyMessage || 'Search failed')
          throw error
        }
      },

      // Computed
      getFilteredResults: () => {
        const { results, filters } = get()
        return results.filter(r => {
          if (filters.minRating && (r.rating || 0) < filters.minRating) return false
          if (filters.hasPhone && !r.phone) return false
          if (filters.hasWebsite && !r.website) return false
          if (filters.searchText) {
            const search = filters.searchText.toLowerCase()
            const name = (r.name || '').toLowerCase()
            const address = (r.address || '').toLowerCase()
            if (!name.includes(search) && !address.includes(search)) return false
          }
          return true
        })
      }
    }),
    {
      name: 'search-store',
      partialize: (state) => ({ filters: state.filters })
    }
  )
)
