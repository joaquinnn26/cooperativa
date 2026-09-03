import React from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  Headphones,
  MapPinned,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  Wrench
} from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { getEmployeePermissionByCargo, getEmployeeRoutesByCargo } from '@/utils/employeePermissions.js'

const iconByPath = {
  '/empleado/anuncios': ClipboardList,
  '/empleado/cobranzas': CreditCard,
  '/empleado/documentacion': FileText,
  '/empleado/facturas': Receipt,
  '/empleado/hoja-ruta': MapPinned,
  '/empleado/incidencias': AlertTriangle,
  '/empleado/indicadores': BarChart3,
  '/empleado/instalaciones': Wrench,
  '/empleado/mediciones': Gauge,
  '/empleado/medidores': Gauge,
  '/empleado/operaciones': Settings,
  '/empleado/pagos': Receipt,
  '/empleado/reclamos': AlertTriangle,
  '/empleado/reportes': BarChart3,
  '/empleado/rutas-medicion': MapPinned,
  '/empleado/servicios': Settings,
  '/empleado/solicitudes-servicio': ClipboardList,
  '/empleado/solicitudes-tecnicas': Wrench,
  '/empleado/soporte': Headphones,
  '/empleado/supervision': ShieldCheck,
  '/empleado/turnos': CalendarClock,
  '/empleado/usuarios': Users
}

export default function EmpleadoDashboard() {
  const cargo = useAuthStore((state) => state.cargo)
  const permission = getEmployeePermissionByCargo(cargo)
  const routes = getEmployeeRoutesByCargo(cargo)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Empleado</h1>
        <p className="mt-2 text-gray-600">{permission?.summary || 'No hay permisos configurados para tu cargo actual.'}</p>
        <p className="mt-1 text-sm font-medium text-gray-500">Cargo: {permission?.label || cargo || 'No informado'}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {routes.map((route) => {
          const Icon = iconByPath[route.to] || ClipboardList
          return (
            <Link key={route.to} to={route.to} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">{route.label}</h2>
                  {route.status === 'planned' ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Planificada</span>
                  ) : null}
                </div>
                <p className="text-sm text-gray-600">{route.description}</p>
              </div>
            </Link>
          )
        })}

        {!routes.length ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
            El cargo actual no tiene vistas asignadas. Revisar la tabla Cargo o la configuracion de permisos.
          </div>
        ) : null}
      </div>
    </div>
  )
}
