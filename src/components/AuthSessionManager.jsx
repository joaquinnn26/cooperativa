import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import { getTokenExpiration } from '@/utils/auth.js'

const EXPIRATION_MESSAGE = 'Tu sesión expiró y tenés que iniciar sesión nuevamente.'

export default function AuthSessionManager() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const verifySession = useAuthStore((state) => state.verifySession)
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (token) verifySession()
  }, [token, verifySession])

  useEffect(() => {
    if (!token) return undefined

    const expiresAt = getTokenExpiration(token)

    if (!expiresAt) {
      return undefined
    }

    const timeoutMs = expiresAt - Date.now()

    if (timeoutMs <= 0) {
      addNotification({
        title: 'Sesión expirada',
        message: EXPIRATION_MESSAGE,
        type: 'error'
      })
      logout()
      navigate('/login', { replace: true, state: { expired: true, from: location } })
      return undefined
    }

    const timer = window.setTimeout(() => {
      addNotification({
        title: 'Sesión expirada',
        message: EXPIRATION_MESSAGE,
        type: 'error'
      })
      logout()
      navigate('/login', { replace: true, state: { expired: true, from: location } })
    }, timeoutMs)

    return () => window.clearTimeout(timer)
  }, [addNotification, location, logout, navigate, token])

  return null
}
