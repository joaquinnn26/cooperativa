import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { isTokenExpired } from '@/utils/auth.js'

export default function ProtectedRoute() {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
