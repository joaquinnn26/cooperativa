import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { getDefaultRouteByRole, isTokenExpired } from '@/utils/auth.js'

export default function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token)
  const rol = useAuthStore((state) => state.rol)

  if (token && !isTokenExpired(token)) {
    return <Navigate to={getDefaultRouteByRole(rol)} replace />
  }

  return <Outlet />
}
