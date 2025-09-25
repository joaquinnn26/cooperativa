export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const notifications = ref([])
  const currentHelpSection = ref(null)

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const addNotification = (notification) => {
    notifications.value.push({
      id: Date.now(),
      ...notification
    })
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const setHelpSection = (section) => {
    currentHelpSection.value = section
  }

  return {
    isLoading: readonly(isLoading),
    notifications: readonly(notifications),
    currentHelpSection: readonly(currentHelpSection),
    setLoading,
    addNotification,
    removeNotification,
    setHelpSection
  }
})
