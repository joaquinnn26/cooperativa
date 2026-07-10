import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  MapPinned,
  Megaphone,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { apiUrl } from '@/config/api.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { obtenerTodosLosTurnos } from '@/hooks/useAdminTurnos.jsx'

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

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.value)) return data.value
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function pickStatus(item) {
  return (
    item?.estado ||
    item?.Estado ||
    item?.estadoSolicitud ||
    item?.EstadoSolicitud?.Nombre ||
    item?.EstadoSolicitud?.nombre ||
    item?.estadoReclamo ||
    item?.EstadoReclamo?.Nombre ||
    item?.EstadoReclamo?.nombre ||
    ''
  )
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

function isClosedWorkflow(item) {
  const status = normalizeText(pickStatus(item))
  return ['aprobado', 'aprobada', 'rechazado', 'rechazada', 'cancelado', 'cancelada', 'cerrado', 'cerrada', 'resuelto', 'resuelta', 'finalizado', 'finalizada'].includes(status)
}

function isResolvedWorkflow(item) {
  const status = normalizeText(pickStatus(item))
  return ['aprobado', 'aprobada', 'resuelto', 'resuelta', 'finalizado', 'finalizada'].includes(status)
}

function isRejectedWorkflow(item) {
  const status = normalizeText(pickStatus(item))
  return ['rechazado', 'rechazada', 'cancelado', 'cancelada'].includes(status)
}

function turnoStatusKey(status) {
  const normalized = normalizeText(status)
  if (normalized === 'aprobada') return 'aprobado'
  if (normalized === 'aceptada') return 'aceptado'
  if (normalized === 'rechazada') return 'rechazado'
  if (normalized === 'cancelada') return 'cancelado'
  if (normalized === 'propuesta') return 'propuesto'
  return normalized
}

function parseDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isWithinLastDays(value, days) {
  const parsed = parseDate(value)
  if (!parsed) return false
  const limit = new Date()
  limit.setDate(limit.getDate() - days)
  return parsed >= limit
}

function percent(value, total) {
  if (!total) return 0
  return Math.round((Number(value || 0) / Number(total || 0)) * 100)
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString('es-AR')}`
}

function resolveServiceName(item) {
  return pickFirst(
    item?.servicioNombre,
    item?.ServicioNombre,
    item?.Servicio?.Nombre,
    item?.servicio?.Nombre,
    item?.service,
    item?.NombreServicio,
    'Servicio'
  )
}

function resolveDate(item) {
  return pickFirst(
    item?.fechaSolicitud,
    item?.FechaSolicitud,
    item?.fecha,
    item?.Fecha,
    item?.createdAt,
    item?.FechaCreacion,
    item?.createdAt
  )
}

const EMPTY_DASHBOARD_STATS = {
  sociosTotal: 0,
  sociosActivos: 0,
  sociosInactivos: 0,
  servicios: 0,
  serviciosAsignados: 0,
  sociosConServicio: 0,
  coberturaServicios: 0,
  solicitudes: 0,
  solicitudesPendientes: 0,
  solicitudesResueltas: 0,
  solicitudesRechazadas: 0,
  solicitudesUltimos30: 0,
  solicitudesTasaResolucion: 0,
  facturasTotal: 0,
  facturasPendientes: 0,
  facturasVencidas: 0,
  facturasPagadas: 0,
  facturasMontoTotal: 0,
  facturasMontoPagado: 0,
  facturasMontoPendiente: 0,
  facturasMontoVencido: 0,
  cobranzaPorcentaje: 0,
  deudaPromedio: 0,
  reclamosTotal: 0,
  reclamosActivos: 0,
  reclamosPendientes: 0,
  reclamosEnProceso: 0,
  reclamosResueltos: 0,
  reclamosUltimos30: 0,
  reclamosTasaResolucion: 0,
  turnosTotal: 0,
  turnosPendientes: 0,
  turnosPropuestos: 0,
  turnosConfirmados: 0,
  turnosRechazados: 0,
  turnosCancelados: 0,
  turnosTasaConfirmacion: 0,
  serviciosPorTipo: [],
  trabajoOperativo: [],
  flujoSolicitudes: [],
  finanzasPorEstado: [],
  saludOperativa: [],
  prioridades: []
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path), { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload || {}

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-gray-900">{label || payload[0]?.name}</p>
      <p className="text-gray-600">{payload[0]?.value}</p>
      {data.amount != null ? <p className="text-gray-600">{formatMoney(data.amount)}</p> : null}
      {data.percent != null ? <p className="text-gray-600">{data.percent}%</p> : null}
    </div>
  )
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
    title: 'Instalacion',
    description: 'Pendientes, altas y control.',
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
    title: 'Rutas',
    description: 'Asignar hojas de ruta a lecturistas.',
    to: '/admin/rutas-medicion',
    icon: MapPinned,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600'
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
  const [statsData, setStatsData] = useState(EMPTY_DASHBOARD_STATS)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [sociosData, serviciosData, solicitudesData, reclamosData, billsData, turnosData, serviciosSocioData] = await Promise.all([
          fetchJson('/socio').catch(() => []),
          fetchJson('/servicio').catch(() => []),
          fetchJson('/solicitudservicio').catch(() => []),
          fetchJson('/reclamo').catch(() => []),
          fetchBills().catch(() => []),
          obtenerTodosLosTurnos().catch(() => []),
          fetchJson('/serviciosocio').catch(() => [])
        ])

        const socios = ensureArray(sociosData)
        const servicios = ensureArray(serviciosData)
        const solicitudes = ensureArray(solicitudesData)
        const reclamos = ensureArray(reclamosData)
        const bills = ensureArray(billsData)
        const turnos = ensureArray(turnosData)
        const serviciosSocio = ensureArray(serviciosSocioData)

        const sociosActivos = socios.filter((item) =>
          normalizeBoolean(item.Activo ?? item.activo, true)
        ).length
        const sociosConServicio = new Set(
          serviciosSocio
            .map((item) => pickFirst(item.idSocio, item.IdSocio, item.Socio?.idSocio, item.socio?.idSocio))
            .filter(Boolean)
            .map(String)
        ).size

        const facturasPendientes = bills.filter((bill) => bill.status !== 'paid')
        const facturasVencidas = bills.filter((bill) => bill.status === 'overdue')
        const facturasPagadas = bills.filter((bill) => bill.status === 'paid')
        const montoTotal = bills.reduce((total, bill) => total + Number(bill.amount || 0), 0)
        const montoPagado = facturasPagadas.reduce((total, bill) => total + Number(bill.amount || 0), 0)
        const montoPendiente = facturasPendientes.reduce((total, bill) => total + Number(bill.amount || 0), 0)
        const montoVencido = facturasVencidas.reduce((total, bill) => total + Number(bill.amount || 0), 0)

        const solicitudesPendientes = solicitudes.filter((item) => !isClosedWorkflow(item))
        const solicitudesResueltas = solicitudes.filter(isResolvedWorkflow)
        const solicitudesRechazadas = solicitudes.filter(isRejectedWorkflow)
        const solicitudesUltimos30 = solicitudes.filter((item) => isWithinLastDays(resolveDate(item), 30)).length

        const reclamosActivos = reclamos.filter((item) => !isClosedWorkflow(item))
        const reclamosResueltos = reclamos.filter(isResolvedWorkflow)
        const reclamosPendientes = reclamos.filter((item) => normalizeText(pickStatus(item)) === 'pendiente')
        const reclamosEnProceso = reclamos.filter((item) => normalizeText(pickStatus(item)) === 'en proceso')
        const reclamosUltimos30 = reclamos.filter((item) => isWithinLastDays(resolveDate(item), 30)).length

        const turnosPendientes = turnos.filter((turno) =>
          ['pendiente', 'propuesto'].includes(turnoStatusKey(turno.estado))
        )
        const turnosPropuestos = turnos.filter((turno) => turnoStatusKey(turno.estado) === 'propuesto')
        const turnosConfirmados = turnos.filter((turno) =>
          ['aprobado', 'aceptado'].includes(turnoStatusKey(turno.estado))
        )
        const turnosRechazados = turnos.filter((turno) => turnoStatusKey(turno.estado) === 'rechazado')
        const turnosCancelados = turnos.filter((turno) => turnoStatusKey(turno.estado) === 'cancelado')

        const serviciosPorTipoMap = serviciosSocio.reduce((acc, item) => {
          const serviceName = resolveServiceName(item)
          acc[serviceName] = (acc[serviceName] || 0) + 1
          return acc
        }, {})
        const serviciosPorTipo = Object.entries(serviciosPorTipoMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)

        const trabajoOperativo = [
          { name: 'Solicitudes', label: 'Solicitudes abiertas', value: solicitudesPendientes.length, color: '#0ea5e9' },
          { name: 'Reclamos', label: 'Reclamos activos', value: reclamosActivos.length, color: '#f43f5e' },
          { name: 'Turnos', label: 'Turnos pendientes', value: turnosPendientes.length, color: '#6366f1' },
          { name: 'Facturas', label: 'Facturas vencidas', value: facturasVencidas.length, color: '#f59e0b' }
        ]

        const flujoSolicitudes = [
          { name: 'Abiertas', value: solicitudesPendientes.length, color: '#0ea5e9' },
          { name: 'Aprobadas', value: solicitudesResueltas.length, color: '#10b981' },
          { name: 'Rechazadas', value: solicitudesRechazadas.length, color: '#f43f5e' }
        ]

        const finanzasPorEstado = [
          { label: 'Pagadas', value: facturasPagadas.length, amount: montoPagado, color: '#10b981' },
          { label: 'Pendientes', value: Math.max(facturasPendientes.length - facturasVencidas.length, 0), amount: Math.max(montoPendiente - montoVencido, 0), color: '#f59e0b' },
          { label: 'Vencidas', value: facturasVencidas.length, amount: montoVencido, color: '#ef4444' }
        ]

        const saludOperativa = [
          { label: 'Cobertura socios', value: sociosConServicio, total: Math.max(sociosActivos, 1), color: '#2563eb' },
          { label: 'Cobranza', value: montoPagado, total: Math.max(montoTotal, 1), color: '#059669' },
          { label: 'Solicitudes resueltas', value: solicitudesResueltas.length, total: Math.max(solicitudes.length, 1), color: '#0ea5e9' },
          { label: 'Reclamos resueltos', value: reclamosResueltos.length, total: Math.max(reclamos.length, 1), color: '#f43f5e' }
        ]

        const prioridades = [
          {
            title: 'Deuda vencida',
            detail: `${formatMoney(montoVencido)} en ${facturasVencidas.length} factura${facturasVencidas.length === 1 ? '' : 's'}`,
            to: '/admin/facturas',
            icon: Receipt,
            classes: 'border-red-100 bg-red-50 text-red-800'
          },
          {
            title: 'Solicitudes abiertas',
            detail: `${solicitudesPendientes.length} pendientes, ${solicitudesUltimos30} nuevas en 30 dias`,
            to: '/admin/solicitudes-servicio',
            icon: ClipboardList,
            classes: 'border-sky-100 bg-sky-50 text-sky-800'
          },
          {
            title: 'Reclamos activos',
            detail: `${reclamosActivos.length} abiertos, ${reclamosUltimos30} nuevos en 30 dias`,
            to: '/admin/reclamos',
            icon: AlertTriangle,
            classes: 'border-rose-100 bg-rose-50 text-rose-800'
          }
        ]

        setStatsData({
          sociosTotal: socios.length,
          sociosActivos,
          sociosInactivos: Math.max(socios.length - sociosActivos, 0),
          servicios: servicios.length,
          serviciosAsignados: serviciosSocio.length,
          sociosConServicio,
          coberturaServicios: percent(sociosConServicio, sociosActivos),
          solicitudes: solicitudes.length,
          solicitudesPendientes: solicitudesPendientes.length,
          solicitudesResueltas: solicitudesResueltas.length,
          solicitudesRechazadas: solicitudesRechazadas.length,
          solicitudesUltimos30,
          solicitudesTasaResolucion: percent(solicitudesResueltas.length + solicitudesRechazadas.length, solicitudes.length),
          facturasTotal: bills.length,
          facturasPendientes: facturasPendientes.length,
          facturasVencidas: facturasVencidas.length,
          facturasPagadas: facturasPagadas.length,
          facturasMontoTotal: montoTotal,
          facturasMontoPagado: montoPagado,
          facturasMontoPendiente: montoPendiente,
          facturasMontoVencido: montoVencido,
          cobranzaPorcentaje: percent(montoPagado, montoTotal),
          deudaPromedio: facturasPendientes.length ? Math.round(montoPendiente / facturasPendientes.length) : 0,
          reclamosTotal: reclamos.length,
          reclamosActivos: reclamosActivos.length,
          reclamosPendientes: reclamosPendientes.length,
          reclamosEnProceso: reclamosEnProceso.length,
          reclamosResueltos: reclamosResueltos.length,
          reclamosUltimos30,
          reclamosTasaResolucion: percent(reclamosResueltos.length, reclamos.length),
          turnosTotal: turnos.length,
          turnosPendientes: turnosPendientes.length,
          turnosPropuestos: turnosPropuestos.length,
          turnosConfirmados: turnosConfirmados.length,
          turnosRechazados: turnosRechazados.length,
          turnosCancelados: turnosCancelados.length,
          turnosTasaConfirmacion: percent(turnosConfirmados.length, turnos.length),
          serviciosPorTipo,
          trabajoOperativo,
          flujoSolicitudes,
          finanzasPorEstado,
          saludOperativa,
          prioridades
        })
      } catch (error) {
        console.error('Error al cargar metricas del panel admin', error)
      }
    }

    loadStats()
  }, [fetchBills])

  const kpiCards = useMemo(
    () => [
      {
        label: 'Cobertura de servicios',
        value: `${statsData.coberturaServicios}%`,
        detail: `${statsData.sociosConServicio}/${statsData.sociosActivos} socios activos con servicio`,
        icon: Users,
        accent: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-100'
      },
      {
        label: 'Pendientes operativos',
        value: statsData.solicitudesPendientes + statsData.reclamosActivos + statsData.turnosPendientes,
        detail: `${statsData.solicitudesPendientes} solicitudes, ${statsData.reclamosActivos} reclamos, ${statsData.turnosPendientes} turnos`,
        icon: Activity,
        accent: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-100'
      },
      {
        label: 'Deuda vencida',
        value: formatMoney(statsData.facturasMontoVencido),
        detail: `${statsData.facturasVencidas} facturas vencidas. Promedio deuda: ${formatMoney(statsData.deudaPromedio)}`,
        icon: DollarSign,
        accent: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-100'
      },
      {
        label: 'Cobranza',
        value: `${statsData.cobranzaPorcentaje}%`,
        detail: `${formatMoney(statsData.facturasMontoPagado)} cobrado de ${formatMoney(statsData.facturasMontoTotal)}`,
        icon: Receipt,
        accent: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100'
      }
    ],
    [statsData]
  )

  const workloadItems = useMemo(
    () => statsData.trabajoOperativo,
    [statsData]
  )

  const billingSegments = useMemo(
    () => statsData.finanzasPorEstado,
    [statsData.finanzasPorEstado]
  )

  const healthRows = useMemo(
    () => statsData.saludOperativa,
    [statsData.saludOperativa]
  )

  const healthChartData = useMemo(
    () =>
      healthRows.map((row) => ({
        ...row,
        percent: Math.round((row.value / row.total) * 100)
      })),
    [healthRows]
  )

  const priorityItems = useMemo(
    () => statsData.prioridades,
    [statsData.prioridades]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-gray-500">Vista ejecutiva</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Panel de administracion</h1>
          <p className="mt-2 text-gray-600">Metricas reales para priorizar cobranza, atencion, instalaciones y resolucion operativa.</p>
        </div>
        <Link
          to="/admin/reportes"
          className="inline-flex w-fit items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        >
          Ver reportes
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Link>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`rounded-lg border ${stat.border} bg-white p-5 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className={`mt-2 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.accent}`} />
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{stat.detail}</p>
            </div>
          )
        })}
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Carga operativa</h2>
              <p className="mt-1 text-sm text-gray-500">Pendientes reales que requieren accion administrativa.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {workloadItems.reduce((total, item) => total + item.value, 0)} pendientes
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={workloadItems} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={54}>
                  {workloadItems.map((item) => (
                    <Cell key={item.label} fill={item.color} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link to="/admin/solicitudes-servicio" className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm font-semibold text-sky-800 hover:bg-white">
              Revisar solicitudes
            </Link>
            <Link to="/admin/reclamos" className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-800 hover:bg-white">
              Ver reclamos
            </Link>
            <Link to="/admin/turnos" className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm font-semibold text-indigo-800 hover:bg-white">
              Gestionar turnos
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Solicitudes resueltas</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{statsData.solicitudesTasaResolucion}%</p>
              <p className="text-xs text-gray-500">{statsData.solicitudesResueltas + statsData.solicitudesRechazadas}/{statsData.solicitudes} cerradas</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Reclamos resueltos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{statsData.reclamosTasaResolucion}%</p>
              <p className="text-xs text-gray-500">{statsData.reclamosResueltos}/{statsData.reclamosTotal} cerrados</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Turnos confirmados</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{statsData.turnosTasaConfirmacion}%</p>
              <p className="text-xs text-gray-500">{statsData.turnosConfirmados}/{statsData.turnosTotal} confirmados</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Facturacion</h2>
                <p className="mt-1 text-sm text-gray-500">Cantidad y monto por estado de cobro.</p>
              </div>
              <Receipt className="h-5 w-5 text-amber-600" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[190px_1fr] sm:items-center">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={billingSegments}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={4}
                    >
                      {billingSegments.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {billingSegments.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-gray-900">{item.value}</span>
                      <span className="text-xs text-gray-500">{formatMoney(item.amount)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Salud del sistema</h2>
                <p className="mt-1 text-sm text-gray-500">Porcentajes reales sobre cobertura, cobranza y resolucion.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={healthChartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="label" type="category" width={108} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#374151' }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="percent" radius={[0, 8, 8, 0]} barSize={16}>
                    {healthChartData.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">Servicios asignados</h2>
            <p className="mt-1 text-sm text-gray-500">Distribucion real de servicios activos/asignados por tipo.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData.serviciosPorTipo}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={44}
                    outerRadius={72}
                    paddingAngle={4}
                  >
                    {statsData.serviciosPorTipo.map((item, index) => (
                      <Cell key={item.name} fill={['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statsData.serviciosPorTipo.length ? statsData.serviciosPorTipo.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'][index % 6] }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No hay servicios asignados para calcular distribucion.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">Flujo de solicitudes</h2>
            <p className="mt-1 text-sm text-gray-500">Permite ver volumen pendiente contra solicitudes ya cerradas.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={statsData.flujoSolicitudes} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
                  {statsData.flujoSolicitudes.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion diaria</h2>
            <p className="text-sm text-gray-500">Primero lo urgente, despues el acceso a cada modulo.</p>
          </div>
          <span className="text-sm font-medium text-gray-500">Prioridades y modulos</span>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-3">
          {priorityItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex min-h-[116px] items-start justify-between gap-4 rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${item.classes}`}
              >
                <span>
                  <span className="block text-sm font-semibold uppercase opacity-80">Prioridad</span>
                  <span className="mt-2 block text-lg font-bold text-gray-900">{item.title}</span>
                  <span className="mt-1 block text-sm text-gray-700">{item.detail}</span>
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/80">
                  <Icon className="h-5 w-5" />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {QUICK_MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.to}
                to={module.to}
                className="group flex min-h-[112px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${module.bg}`}>
                    <Icon className={`h-5 w-5 ${module.color}`} />
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 text-gray-300 transition group-hover:text-blue-500" />
                </span>
                <span className="mt-4">
                  <span className="block font-semibold text-gray-900">{module.title}</span>
                  <span className="mt-1 block text-sm leading-snug text-gray-600">{module.description}</span>
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Configuracion y comunicacion</h3>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {SECONDARY_MODULES.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
