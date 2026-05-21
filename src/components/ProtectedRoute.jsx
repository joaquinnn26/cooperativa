import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { hasActiveSession, rolesMatch } from '@/utils/auth.js'

export default function ProtectedRoute({ role }) {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const rol = useAuthStore((state) => state.rol)
  const usuario = useAuthStore((state) => state.usuario)

  if (!hasActiveSession({ token, usuario })) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && !rolesMatch(rol, role)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
