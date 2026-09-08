import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { canEmployeeAccessPath, getEmployeePermissionByCargo, getEmployeeRouteMeta } from '@/utils/employeePermissions.js'

export default function CargoProtectedRoute() {
  const location = useLocation()
  const cargo = useAuthStore((state) => state.cargo)
  const permission = getEmployeePermissionByCargo(cargo)
  const route = getEmployeeRouteMeta(location.pathname)

  if (canEmployeeAccessPath(cargo, location.pathname)) {
    return <Outlet />
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="text-sm font-semibold uppercase text-amber-700">Acceso restringido por cargo</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{route?.label || 'Vista no disponible'}</h1>
        <p className="mt-2 text-sm">
          Tu cargo actual es <strong>{permission?.label || cargo || 'No informado'}</strong> y no tiene permiso para acceder a esta vista.
        </p>
        <Link
          to="/empleado"
          className="mt-5 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  )
}
