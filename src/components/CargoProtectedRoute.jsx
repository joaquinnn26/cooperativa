import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { permiteRutaLaboral } from '@/utils/laboralPermissions.js'
export default function CargoProtectedRoute() {
  const { pathname } = useLocation()
  const areas = useAuthStore(s => s.areas)
  if (permiteRutaLaboral(areas, pathname)) return <Outlet />
  return <div className="card"><h1 className="text-xl font-bold">Acceso no asignado</h1><p className="my-4">Esta vista requiere una función o designación vigente en el área correspondiente.</p><Link className="btn-primary" to="/empleado">Volver a mi trabajo</Link></div>
}
