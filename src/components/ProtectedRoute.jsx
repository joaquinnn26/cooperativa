import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { isTokenExpired } from '@/utils/auth.js'

export default function ProtectedRoute({ role }) {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const rol = useAuthStore((state) => state.rol)

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && rol && role !== rol) {
    return <Navigate to={rol === 'Admin' ? '/admin' : rol === 'Empleado' ? '/empleado' : '/socio'} replace />
  }

  return <Outlet />
}
