import React from 'react'
import { tieneAltaPendiente } from '@/utils/altaSocio.js'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { hasActiveSession, rolesMatch } from '@/utils/auth.js'

export default function ProtectedRoute({ role, roles }) {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const rol = useAuthStore((state) => state.rol)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const altaSocio = useAuthStore((state) => state.altaSocio)

  if (sessionStatus === 'checking') {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-gray-600">Validando sesion...</div>
  }

  if (sessionStatus !== 'authenticated' || !hasActiveSession({ token })) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if ((role && !rolesMatch(rol, role)) || (roles && !roles.some(r => rolesMatch(rol, r)))) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (tieneAltaPendiente(rol, altaSocio) && location.pathname !== '/socio/alta') {
    return <Navigate to="/socio/alta" replace />
  }

  return <Outlet />
}
