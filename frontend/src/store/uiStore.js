import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // State
  sidebarOpen: true,
  activeModal: null,
  modalData: null,

  // Actions
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (modalId, data = null) => set({
    activeModal: modalId,
    modalData: data
  }),

  closeModal: () => set({
    activeModal: null,
    modalData: null
  })
}))
