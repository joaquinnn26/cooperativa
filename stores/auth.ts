export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  const userType = computed(() => user.value?.type || null)

  const login = async (credentials) => {
    try {
      // Simulación de login - aquí conectarías con tu API
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    user.value = null
    navigateTo('/')
  }

  const register = async (userData) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData
      })
      
      user.value = response.user
      return response
    } catch (error) {
      throw error
    }
  }

  return {
    user: readonly(user),
    isLoggedIn,
    userType,
    login,
    logout,
    register
  }
})
