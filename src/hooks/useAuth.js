import { useCallback } from 'react'
import useAuthStore from '@/store/authStore.js'

export function useAuth() {
  const session = useAuthStore()

  const login = useCallback(
    (email, password) => session.login({ email, password }),
    [session.login]
  )

  return {
    user: {
      usuario: session.usuario,
      email: session.email,
      rol: session.rol,
      cargo: session.cargo,
      idSocio: session.idSocio,
      idEmpleado: session.idEmpleado
    },
    token: session.token,
    loading: session.sessionStatus === 'checking',
    error: null,
    login,
    logout: session.logout,
    isAuthenticated: session.sessionStatus === 'authenticated'
  }
}
