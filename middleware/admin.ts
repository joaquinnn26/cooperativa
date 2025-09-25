// Middleware para verificar permisos de administrador
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
  
  if (authStore.userType !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acceso denegado. Se requieren permisos de administrador.'
    })
  }
})
