import { tieneAltaPendiente } from '@/utils/altaSocio.js'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { getDefaultRouteByRole, hasActiveSession } from '@/utils/auth.js'

export default function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token)
  const altaSocio = useAuthStore((state) => state.altaSocio)
  const rol = useAuthStore((state) => state.rol)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  if (sessionStatus === 'checking') {
    return <div className="mx-auto max-w-md px-4 py-10 text-gray-600">Validando sesion...</div>
  }

  if (sessionStatus === 'authenticated' && hasActiveSession({ token })) {
    return <Navigate to={tieneAltaPendiente(rol, altaSocio) ? '/socio/alta' : getDefaultRouteByRole(rol)} replace />
  }

  return <Outlet />
}
