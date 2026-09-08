import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { getEmployeePermissionByCargo, getEmployeeRouteMeta } from '@/utils/employeePermissions.js'

export default function EmpleadoCargoVista() {
  const location = useLocation()
  const cargo = useAuthStore((state) => state.cargo)
  const permission = getEmployeePermissionByCargo(cargo)
  const route = getEmployeeRouteMeta(location.pathname)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-600">{permission?.label || cargo || 'Empleado'}</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{route?.label || 'Vista de empleado'}</h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              {route?.description || 'Esta vista pertenece al circuito operativo del empleado.'}
            </p>
          </div>
          <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Esta vista ya esta conectada al sistema de permisos por cargo. Queda pendiente implementar la logica funcional del modulo.
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Permiso activo</p>
            <p className="mt-1 text-sm text-gray-600">Solo empleados con cargos habilitados pueden entrar a esta ruta.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Proximo paso</p>
            <p className="mt-1 text-sm text-gray-600">Conectar esta pantalla con endpoints y acciones reales del sector.</p>
          </div>
        </div>

        <Link
          to="/empleado"
          className="mt-6 inline-flex rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  )
}
