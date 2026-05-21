import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  Megaphone,
  Receipt,
  Settings,
  UserPlus,
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
    if (['true', '1', 'activo', 'si', 'sí'].includes(normalized)) return true
    if (['false', '0', 'inactivo', 'no'].includes(normalized)) return false
  }
  return fallback
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path), { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

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
      { label: 'Socios activos', value: statsData.sociosActivos, icon: Users, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
      { label: 'Servicios', value: statsData.servicios, icon: Settings, bgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
      { label: 'Solicitudes', value: statsData.solicitudes, icon: ClipboardList, bgColor: 'bg-sky-100', iconColor: 'text-sky-600' },
      { label: 'Facturas pendientes', value: statsData.facturasPendientes, icon: Receipt, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' }
    ],
    [statsData]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel de Administracion</h1>
        <p className="text-lg text-gray-600">Resumen general y accesos a los modulos de gestion.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div className="card" key={stat.label}>
            <div className="flex items-center">
              <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Socios y Empleados</h2>
          <div className="space-y-4">
            <a href="/admin/socios" className="flex items-center rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100">
              <Users className="mr-4 h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar socios</h3>
                <p className="text-sm text-gray-600">Altas, bajas, edicion y estado.</p>
              </div>
            </a>
            <a href="/admin/empleados" className="flex items-center rounded-lg bg-amber-50 p-4 transition-colors hover:bg-amber-100">
              <Briefcase className="mr-4 h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar empleados</h3>
                <p className="text-sm text-gray-600">Cargos, altas y bajas.</p>
              </div>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Servicios y Lecturas</h2>
          <div className="space-y-4">
            <a href="/admin/servicios" className="flex items-center rounded-lg bg-violet-50 p-4 transition-colors hover:bg-violet-100">
              <Settings className="mr-4 h-8 w-8 text-violet-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Configurar servicios</h3>
                <p className="text-sm text-gray-600">ABM de servicios y parametros.</p>
              </div>
            </a>
            <a href="/admin/medidores" className="flex items-center rounded-lg bg-amber-50 p-4 transition-colors hover:bg-amber-100">
              <Zap className="mr-4 h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar medidores</h3>
                <p className="text-sm text-gray-600">Instalacion y estado de medidores.</p>
              </div>
            </a>
            <a href="/admin/lecturas" className="flex items-center rounded-lg bg-orange-50 p-4 transition-colors hover:bg-orange-100">
              <BarChart3 className="mr-4 h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Registrar lecturas</h3>
                <p className="text-sm text-gray-600">Carga simple por socio, medidor y servicio.</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Solicitudes y Documentos</h2>
          <div className="space-y-4">
            <a href="/admin/solicitudes-servicio" className="flex items-center rounded-lg bg-sky-50 p-4 transition-colors hover:bg-sky-100">
              <ClipboardList className="mr-4 h-8 w-8 text-sky-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Revisar solicitudes</h3>
                <p className="text-sm text-gray-600">Aprobacion, rechazo y documentos cargados.</p>
              </div>
            </a>
            <a href="/admin/requisitos-servicio" className="flex items-center rounded-lg bg-violet-50 p-4 transition-colors hover:bg-violet-100">
              <FileText className="mr-4 h-8 w-8 text-violet-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar requisitos</h3>
                <p className="text-sm text-gray-600">Requisitos por tipo de servicio.</p>
              </div>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Facturacion y Comunicacion</h2>
          <div className="space-y-4">
            <a href="/admin/facturas" className="flex items-center rounded-lg bg-indigo-50 p-4 transition-colors hover:bg-indigo-100">
              <Receipt className="mr-4 h-8 w-8 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Cargar facturas</h3>
                <p className="text-sm text-gray-600">Alta manual de facturas y link de pago.</p>
              </div>
            </a>
            <a href="/admin/anuncios" className="flex items-center rounded-lg bg-pink-50 p-4 transition-colors hover:bg-pink-100">
              <Megaphone className="mr-4 h-8 w-8 text-pink-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Anuncios</h3>
                <p className="text-sm text-gray-600">Comunicados visibles para socios.</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Indicadores rapidos</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="font-semibold text-gray-900">Reclamos activos</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-700">{statsData.reclamosActivos}</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-gray-900">Facturas pendientes</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-700">{statsData.facturasPendientes}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <p className="font-semibold text-gray-900">Socios activos</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-700">{statsData.sociosActivos}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
