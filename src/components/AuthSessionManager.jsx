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
  const refreshLaboralProfile = useAuthStore((state) => state.refreshLaboralProfile)
  const rol = useAuthStore((state) => state.rol)
  const areas = useAuthStore((state) => state.areas)
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (token) verifySession()
  }, [token, verifySession])

  useEffect(() => {
    // La pantalla pendiente tiene su propia consulta; aquí se sincronizan traslados y cambios de puesto.
    if (!token || rol !== 'Empleado' || !areas.length) return
    const abort = new AbortController()
    let running = false
    const refresh = async () => {
      if (running || document.visibilityState === 'hidden') return
      running = true
      try { await refreshLaboralProfile({ signal: abort.signal }) } catch { /* La API sigue validando permisos en cada operación. */ }
      finally { running = false }
    }
    const interval = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    return () => { abort.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [token, rol, areas.length, refreshLaboralProfile])

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
