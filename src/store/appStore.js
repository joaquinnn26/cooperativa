import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  isLoading: false,
  notifications: [],
  currentHelpSection: null,

  setLoading: (isLoading) => set({ isLoading }),

  addNotification: (notification) => {
    const id = notification.id ?? Date.now()
    set((state) => ({
      notifications: [...state.notifications, { id, ...notification }]
    }))

    setTimeout(() => get().removeNotification(id), 5000)
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  setHelpSection: (section) => set({ currentHelpSection: section })
}))

export default useAppStore
