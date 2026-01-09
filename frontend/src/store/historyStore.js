import { create } from 'zustand'
import { historyAPI } from '../services/api'

export const useHistoryStore = create((set, get) => ({
  // State
  searches: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },

  // Actions
  fetchHistory: async (page = 1, savedOnly = false) => {
    set({ isLoading: true, error: null })
    try {
      const response = await historyAPI.getAll({ page, savedOnly })
      set({
        searches: response?.data?.searches || [],
        pagination: response?.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
        isLoading: false
      })
    } catch (error) {
      set({ 
        error: error?.friendlyMessage || 'Failed to load history', 
        isLoading: false,
        searches: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      })
    }
  },

  saveSearch: async (searchId, name) => {
    try {
      await historyAPI.save(searchId, name)
      get().fetchHistory()
      return true
    } catch (error) {
      throw error
    }
  },

  deleteSearch: async (searchId) => {
    try {
      await historyAPI.delete(searchId)
      set(state => ({
        searches: state.searches.filter(s => s.id !== searchId)
      }))
      return true
    } catch (error) {
      throw error
    }
  },

  getRerunParams: async (searchId) => {
    const response = await historyAPI.rerun(searchId)
    return response.data
  }
}))
