import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import useAuthStore from '@/store/authStore.js'
import { apiUrl } from '@/config/api.js'
import { createAvisosApi } from './avisosApi.js'
import { createAvisosSession } from './avisosSession.js'
import { puedeConsultarAvisos } from './avisosModel.js'

const AvisosContext = createContext(null)

export function AvisosProvider({ children }) {
  const token = useAuthStore(state => state.token)
  const rol = useAuthStore(state => state.rol)
  const idSocio = useAuthStore(state => state.idSocio)
  const status = useAuthStore(state => state.sessionStatus)
  const altaSocio = useAuthStore(state => state.altaSocio)
  const enabled = puedeConsultarAvisos({ token, rol, idSocio, sessionStatus: status, altaSocio })
  const session = useMemo(() => createAvisosSession(createAvisosApi({ url: apiUrl, token }), {
    isCurrent: () => {
      const current = useAuthStore.getState()
      return enabled && current.token === token && current.idSocio === idSocio && puedeConsultarAvisos(current)
    }
  }), [token, idSocio, rol, enabled])

  useEffect(() => {
    if (!enabled) return () => session.dispose()
    // React StrictMode may set up this effect again after its cleanup.
    session.start()
    session.refresh(true)
    const refresh = () => { if (document.visibilityState !== 'hidden') session.poll() }
    const timer = window.setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      session.dispose()
    }
  }, [session, enabled])

  const value = useMemo(() => ({ session, enabled }), [session, enabled])
  return <AvisosContext.Provider value={value}>{children}</AvisosContext.Provider>
}

export function useAvisos() {
  const context = useContext(AvisosContext)
  if (!context) throw new Error('Los avisos requieren su proveedor de sesión.')
  const state = useSyncExternalStore(context.session.subscribe, context.session.getSnapshot)
  return { ...state, ...context }
}
