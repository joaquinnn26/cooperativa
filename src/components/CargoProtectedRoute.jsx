import React from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { inicioLaboral, permiteRutaLaboral } from '@/utils/laboralPermissions.js'
import AsignacionPendiente from '@/features/empleado/components/AsignacionPendiente.jsx'
export default function CargoProtectedRoute() {
  const { pathname } = useLocation()
  const areas = useAuthStore(s => s.areas)
  if (!areas.length) return <AsignacionPendiente />
  const home = inicioLaboral(areas)
  if (pathname === '/empleado' && home !== pathname) return <Navigate to={home} replace />
  if (permiteRutaLaboral(areas, pathname)) return <Outlet />
  return <div className="card"><h1 className="text-xl font-bold">Acceso no asignado</h1><p className="my-4">Esta vista requiere una función o designación vigente en el área correspondiente.</p><Link className="btn-primary" to="/empleado">Volver a mi trabajo</Link></div>
}
