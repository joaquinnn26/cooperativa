import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  FileText,
  Megaphone,
  Receipt,
  Settings,
  Users,
  Zap
} from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import useCooperativeStore from '@/store/cooperativeStore.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'activo', 'si'].includes(normalized)) return true
    if (['false', '0', 'inactivo', 'no'].includes(normalized)) return false
  }
  return fallback
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path), { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

const QUICK_MODULES = [
  {
    title: 'Socios',
    description: 'Alta, edicion y estado de socios.',
    to: '/admin/socios',
    icon: Users,
    bg: 'bg-blue-50',
    color: 'text-blue-600'
  },
  {
    title: 'Empleados',
    description: 'Cargos, altas y bajas.',
    to: '/admin/empleados',
    icon: Briefcase,
    bg: 'bg-amber-50',
    color: 'text-amber-600'
  },
  {
    title: 'Solicitudes',
    description: 'Revisar tramites y documentos.',
    to: '/admin/solicitudes-servicio',
    icon: ClipboardList,
    bg: 'bg-sky-50',
    color: 'text-sky-600'
  },
  {
    title: 'Facturas',
    description: 'Cargar y gestionar estados.',
    to: '/admin/facturas',
    icon: Receipt,
    bg: 'bg-indigo-50',
    color: 'text-indigo-600'
  },
  {
    title: 'Medidores',
    description: 'Instalacion y control.',
    to: '/admin/medidores',
    icon: Zap,
    bg: 'bg-yellow-50',
    color: 'text-yellow-600'
  },
  {
    title: 'Lecturas',
    description: 'Registro de mediciones.',
    to: '/admin/lecturas',
    icon: BarChart3,
    bg: 'bg-orange-50',
    color: 'text-orange-600'
  },
  {
    title: 'Reclamos',
    description: 'Seguimiento de reclamos de socios.',
    to: '/admin/reclamos',
    icon: AlertTriangle,
    bg: 'bg-red-50',
    color: 'text-red-600'
  },
  {
    title: 'Turnos',
    description: 'Aprobar o rechazar solicitudes.',
    to: '/admin/turnos',
    icon: CalendarCheck,
    bg: 'bg-cyan-50',
    color: 'text-cyan-600'
  }
]

const SECONDARY_MODULES = [
  { title: 'Servicios', to: '/admin/servicios', icon: Settings },
  { title: 'Requisitos', to: '/admin/requisitos-servicio', icon: FileText },
  { title: 'Anuncios', to: '/admin/anuncios', icon: Megaphone }
]

export default function AdminDashboard() {
  const fetchBills = useCooperativeStore((state) => state.fetchBills)
  const [statsData, setStatsData] = useState({
    sociosActivos: 0,
    servicios: 0,
    solicitudes: 0,
    facturasPendientes: 0,
    reclamosActivos: 0
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [sociosData, serviciosData, solicitudesData, reclamosData, billsData] = await Promise.all([
          fetchJson('/socio').catch(() => []),
          fetchJson('/servicio').catch(() => []),
          fetchJson('/solicitudservicio').catch(() => []),
          fetchJson('/reclamo').catch(() => []),
          fetchBills().catch(() => [])
        ])

        setStatsData({
          sociosActivos: (Array.isArray(sociosData) ? sociosData : []).filter((item) =>
            normalizeBoolean(item.Activo ?? item.activo, true)
          ).length,
          servicios: Array.isArray(serviciosData) ? serviciosData.length : 0,
          solicitudes: Array.isArray(solicitudesData) ? solicitudesData.length : 0,
          facturasPendientes: (Array.isArray(billsData) ? billsData : []).filter((bill) => bill.status !== 'paid').length,
          reclamosActivos: Array.isArray(reclamosData) ? reclamosData.length : 0
        })
      } catch (error) {
        console.error('Error al cargar metricas del panel admin', error)
      }
    }

    loadStats()
  }, [fetchBills])

  const stats = useMemo(
    () => [
      { label: 'Socios activos', value: statsData.sociosActivos, color: 'text-blue-700', bg: 'bg-blue-50' },
      { label: 'Servicios', value: statsData.servicios, color: 'text-violet-700', bg: 'bg-violet-50' },
      { label: 'Solicitudes', value: statsData.solicitudes, color: 'text-sky-700', bg: 'bg-sky-50' },
      { label: 'Facturas pendientes', value: statsData.facturasPendientes, color: 'text-emerald-700', bg: 'bg-emerald-50' }
    ],
    [statsData]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel de administracion</h1>
        <p className="text-lg text-gray-600">Accesos principales y resumen general del sistema.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border border-gray-200 ${stat.bg} p-5 shadow-sm`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Accesos principales</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.to} to={module.to} className={`rounded-2xl border border-gray-200 ${module.bg} p-5 transition-colors hover:border-gray-300 hover:bg-white`}>
                <div className={`mb-4 inline-flex rounded-full p-3 ${module.bg}`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{module.description}</p>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Pendientes a revisar</h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between rounded-xl bg-sky-50 p-4">
              <div>
                <p className="font-semibold text-gray-900">Solicitudes de servicio</p>
                <p className="text-sm text-gray-600">Tenes {statsData.solicitudes} solicitud(es) para revisar.</p>
              </div>
              <Link to="/admin/solicitudes-servicio" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                Abrir
              </Link>
            </div>

            <div className="flex items-start justify-between rounded-xl bg-emerald-50 p-4">
              <div>
                <p className="font-semibold text-gray-900">Facturas pendientes</p>
                <p className="text-sm text-gray-600">Hay {statsData.facturasPendientes} factura(s) que requieren seguimiento.</p>
              </div>
              <Link to="/admin/facturas" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Abrir
              </Link>
            </div>

            <div className="flex items-start justify-between rounded-xl bg-red-50 p-4">
              <div>
                <p className="font-semibold text-gray-900">Reclamos activos</p>
                <p className="text-sm text-gray-600">Actualmente hay {statsData.reclamosActivos} reclamo(s) registrados.</p>
              </div>
              <Link to="/admin/reclamos" className="text-sm font-semibold text-red-700 hover:text-red-800">
                Abrir
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Otros accesos</h2>
          <div className="space-y-3">
            {SECONDARY_MODULES.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="font-semibold text-gray-900">Recordatorio</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">Usa este panel solo como punto de entrada. La gestion diaria conviene hacerla desde cada modulo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
