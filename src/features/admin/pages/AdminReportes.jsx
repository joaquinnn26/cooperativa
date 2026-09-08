import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  FileDown,
  FileSpreadsheet,
  Receipt,
  Users,
  Wrench
} from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { exportTable } from '@/utils/exportTable.js'
import { formatDate } from '@/utils/formatDate.js'

const REPORT_COLUMNS = [
  { header: 'Reporte', value: (row) => row.reporte },
  { header: 'Tipo', value: (row) => row.tipo },
  { header: 'Identificador', value: (row) => row.identificador },
  { header: 'Socio', value: (row) => row.socio },
  { header: 'Detalle', value: (row) => row.detalle },
  { header: 'Estado', value: (row) => row.estado },
  { header: 'Monto', value: (row) => row.monto },
  { header: 'Fecha', value: (row) => row.fecha }
]

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path), { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.value)) return data.value
  return []
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = normalizeText(value)
    if (['true', '1', 'activo', 'activa', 'si'].includes(normalized)) return true
    if (['false', '0', 'inactivo', 'inactiva', 'no'].includes(normalized)) return false
  }
  return fallback
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

function resolveSocioName(entity) {
  const persona = entity?.Persona || entity?.persona || entity?.Socio?.Persona || entity?.socio?.persona
  const direct = pickFirst(entity?.socioNombre, entity?.SocioNombre, entity?.nombreSocio, entity?.NombreSocio)
  if (direct) return direct
  return [persona?.Nombre || persona?.nombre || entity?.Nombre, persona?.Apellido || persona?.apellido || entity?.Apellido]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Socio'
}

function resolveServiceName(entity) {
  return pickFirst(
    entity?.servicioNombre,
    entity?.ServicioNombre,
    entity?.Servicio?.Nombre,
    entity?.servicio?.Nombre,
    entity?.ServicioSocio?.Servicio?.Nombre,
    entity?.servicioSocio?.servicio?.Nombre,
    entity?.NombreServicio,
    entity?.Nombre,
    'Servicio'
  )
}

function resolveStatus(entity) {
  return pickFirst(
    entity?.estado,
    entity?.Estado,
    entity?.status,
    entity?.EstadoSolicitud?.Nombre,
    entity?.estadoSolicitud?.nombre,
    'Sin estado'
  )
}

function resolveDate(entity) {
  return pickFirst(
    entity?.fechaSolicitud,
    entity?.FechaSolicitud,
    entity?.Fecha,
    entity?.fecha,
    entity?.createdAt,
    entity?.FechaCreacion,
    ''
  )
}

function statusCount(items, status) {
  const target = normalizeText(status)
  return items.filter((item) => normalizeText(resolveStatus(item)) === target).length
}

function ReportTable({ title, subtitle, columns, rows, emptyText = 'No hay datos para mostrar.' }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || `${title}-${index}`} className="border-t border-gray-100">
                {columns.map((column) => (
                  <td key={column.header} className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>
                    {column.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="px-4 py-8 text-center text-sm text-gray-500">{emptyText}</div> : null}
    </section>
  )
}

export default function AdminReportes() {
  const fetchBills = useCooperativeStore((state) => state.fetchBills)
  const [bills, setBills] = useState([])
  const [claims, setClaims] = useState([])
  const [socios, setSocios] = useState([])
  const [requests, setRequests] = useState([])
  const [assignments, setAssignments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [billData, claimsData, sociosData, requestsData, assignmentsData] = await Promise.all([
          fetchBills().catch(() => []),
          fetchJson('/reclamo').catch(() => []),
          fetchJson('/socio').catch(() => []),
          fetchJson('/solicitudservicio').catch(() => []),
          fetchJson('/serviciosocio').catch(() => [])
        ])

        setBills(ensureArray(billData))
        setClaims(ensureArray(claimsData))
        setSocios(ensureArray(sociosData))
        setRequests(ensureArray(requestsData))
        setAssignments(ensureArray(assignmentsData))
      } catch (loadError) {
        setError(loadError.message || 'No se pudo generar el reporte.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [fetchBills])

  const metrics = useMemo(() => {
    const paidBills = bills.filter((bill) => bill.status === 'paid')
    const pendingBills = bills.filter((bill) => bill.status !== 'paid')
    const overdueBills = bills.filter((bill) => bill.status === 'overdue')
    const activeClaims = claims.filter((claim) => !['resuelto', 'cancelado'].includes(normalizeText(resolveStatus(claim))))
    const activeSocios = socios.filter((socio) => normalizeBoolean(socio.Activo ?? socio.activo, true))
    const activeAssignments = assignments.filter((assignment) => normalizeText(resolveStatus(assignment)) !== 'inactivo')

    return {
      collected: paidBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      pendingAmount: pendingBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      overdueAmount: overdueBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      paidBills: paidBills.length,
      pendingBills: pendingBills.length,
      overdueBills: overdueBills.length,
      activeClaims: activeClaims.length,
      totalClaims: claims.length,
      activeSocios: activeSocios.length,
      inactiveSocios: Math.max(socios.length - activeSocios.length, 0),
      totalSocios: socios.length,
      activeAssignments: activeAssignments.length,
      pendingRequests: requests.filter((request) => ['pendiente', 'en revision', 'pendiente instalacion'].includes(normalizeText(resolveStatus(request)))).length
    }
  }, [assignments, bills, claims, requests, socios])

  const serviceRows = useMemo(() => {
    const grouped = assignments.reduce((acc, assignment) => {
      const name = resolveServiceName(assignment)
      const status = normalizeText(resolveStatus(assignment))
      if (!acc[name]) acc[name] = { id: name, servicio: name, total: 0, activos: 0, inactivos: 0 }
      acc[name].total += 1
      if (status === 'inactivo') acc[name].inactivos += 1
      else acc[name].activos += 1
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => b.total - a.total)
  }, [assignments])

  const requestRows = useMemo(() => {
    const statuses = ['Pendiente', 'En revision', 'Pendiente instalacion', 'Aprobada', 'Rechazada', 'Cancelada']
    return statuses.map((status) => ({
      id: status,
      estado: status,
      cantidad: statusCount(requests, status)
    }))
  }, [requests])

  const claimRows = useMemo(() => {
    const statuses = ['Pendiente', 'En proceso', 'Resuelto', 'Cancelado']
    return statuses.map((status) => ({
      id: status,
      estado: status,
      cantidad: statusCount(claims, status)
    }))
  }, [claims])

  const recentActivityRows = useMemo(() => {
    const billRows = bills.slice(0, 8).map((bill) => ({
      id: `bill-${bill.id}`,
      tipo: 'Factura',
      socio: bill.socioNombre || 'Socio',
      detalle: `Factura #${bill.id}`,
      estado: bill.status,
      fecha: bill.createdAt
    }))
    const requestRowsRecent = requests.slice(0, 8).map((request) => ({
      id: `request-${pickFirst(request.idSolicitudServicio, request.IdSolicitudServicio, request.id)}`,
      tipo: 'Solicitud',
      socio: resolveSocioName(request),
      detalle: resolveServiceName(request),
      estado: resolveStatus(request),
      fecha: resolveDate(request)
    }))
    const claimRowsRecent = claims.slice(0, 8).map((claim) => ({
      id: `claim-${pickFirst(claim.idReclamo, claim.IdReclamo, claim.id)}`,
      tipo: 'Reclamo',
      socio: resolveSocioName(claim),
      detalle: pickFirst(claim.Asunto, claim.asunto, claim.Descripcion, claim.descripcion, 'Reclamo'),
      estado: resolveStatus(claim),
      fecha: resolveDate(claim)
    }))

    return [...billRows, ...requestRowsRecent, ...claimRowsRecent]
      .sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
      .slice(0, 12)
  }, [bills, claims, requests])

  const exportRows = useMemo(() => {
    const billingRows = bills.map((bill) => ({
      reporte: 'Facturacion',
      tipo: 'Factura',
      identificador: bill.id,
      socio: bill.socioNombre,
      detalle: bill.service || '',
      estado: bill.status,
      monto: bill.amount,
      fecha: bill.createdAt
    }))
    const claimExportRows = claims.map((claim) => ({
      reporte: 'Reclamos',
      tipo: 'Reclamo',
      identificador: pickFirst(claim.idReclamo, claim.IdReclamo, claim.id),
      socio: resolveSocioName(claim),
      detalle: pickFirst(claim.Asunto, claim.asunto, claim.Descripcion, claim.descripcion, ''),
      estado: resolveStatus(claim),
      monto: '',
      fecha: resolveDate(claim)
    }))
    const requestExportRows = requests.map((request) => ({
      reporte: 'Solicitudes',
      tipo: 'Solicitud de servicio',
      identificador: pickFirst(request.idSolicitudServicio, request.IdSolicitudServicio, request.id),
      socio: resolveSocioName(request),
      detalle: resolveServiceName(request),
      estado: resolveStatus(request),
      monto: '',
      fecha: resolveDate(request)
    }))
    const assignmentExportRows = assignments.map((assignment) => ({
      reporte: 'Servicios asignados',
      tipo: 'Servicio socio',
      identificador: pickFirst(assignment.idServicioSocio, assignment.IdServicioSocio, assignment.id),
      socio: resolveSocioName(assignment),
      detalle: resolveServiceName(assignment),
      estado: resolveStatus(assignment),
      monto: pickFirst(assignment.tarifa, assignment.Tarifa, ''),
      fecha: ''
    }))
    const socioExportRows = socios.map((socio) => ({
      reporte: 'Socios',
      tipo: 'Socio',
      identificador: pickFirst(socio.idSocio, socio.IdSocio, socio.id),
      socio: resolveSocioName(socio),
      detalle: pickFirst(socio.Documento, socio.documento, socio.Persona?.Documento, ''),
      estado: normalizeBoolean(socio.Activo ?? socio.activo, true) ? 'Activo' : 'Inactivo',
      monto: '',
      fecha: ''
    }))

    return [...billingRows, ...claimExportRows, ...requestExportRows, ...assignmentExportRows, ...socioExportRows]
  }, [assignments, bills, claims, requests, socios])

  const exportReport = async (type) => {
    setExporting(type)
    try {
      await exportTable({
        type,
        filename: `reporte-general-cooperativa-${new Date().toISOString().slice(0, 10)}`,
        title: 'Reporte general cooperativa',
        columns: REPORT_COLUMNS,
        rows: exportRows
      })
    } finally {
      setExporting(null)
    }
  }

  const cards = [
    {
      label: 'Socios activos',
      value: String(metrics.activeSocios),
      detail: `${metrics.totalSocios} socios totales, ${metrics.inactiveSocios} inactivos`,
      icon: Users,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      label: 'Facturas cobradas',
      value: formatMoney(metrics.collected),
      detail: `${metrics.paidBills} facturas pagadas`,
      icon: Receipt,
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      label: 'Pendiente de cobro',
      value: formatMoney(metrics.pendingAmount),
      detail: `${metrics.pendingBills} pendientes, ${metrics.overdueBills} vencidas`,
      icon: DollarSign,
      color: 'bg-amber-100 text-amber-700'
    },
    {
      label: 'Solicitudes pendientes',
      value: String(metrics.pendingRequests),
      detail: `${requests.length} solicitudes totales`,
      icon: ClipboardList,
      color: 'bg-cyan-100 text-cyan-700'
    },
    {
      label: 'Reclamos activos',
      value: String(metrics.activeClaims),
      detail: `${metrics.totalClaims} reclamos totales`,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-700'
    },
    {
      label: 'Servicios asignados',
      value: String(metrics.activeAssignments),
      detail: `${assignments.length} asignaciones registradas`,
      icon: Wrench,
      color: 'bg-violet-100 text-violet-700'
    }
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Indicadores generales de socios, servicios, solicitudes, facturacion y reclamos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportReport('PDF')}
            disabled={loading || Boolean(error) || Boolean(exporting) || !exportRows.length}
            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            {exporting === 'PDF' ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={() => exportReport('Excel')}
            disabled={loading || Boolean(error) || Boolean(exporting) || !exportRows.length}
            className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            {exporting === 'Excel' ? 'Generando...' : 'Excel'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
      {loading && <div className="card text-gray-600">Generando reportes...</div>}

      {!loading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="card flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-1 text-sm text-gray-500">{card.detail}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ReportTable
              title="Facturacion por estado"
              subtitle="Monto y cantidad de facturas segun estado actual."
              columns={[
                { header: 'Estado', value: (row) => row.estado },
                { header: 'Cantidad', value: (row) => row.cantidad, align: 'right' },
                { header: 'Monto', value: (row) => formatMoney(row.monto), align: 'right' }
              ]}
              rows={[
                { id: 'paid', estado: 'Pagadas', cantidad: metrics.paidBills, monto: metrics.collected },
                { id: 'pending', estado: 'Pendientes', cantidad: metrics.pendingBills, monto: metrics.pendingAmount },
                { id: 'overdue', estado: 'Vencidas', cantidad: metrics.overdueBills, monto: metrics.overdueAmount }
              ]}
            />

            <ReportTable
              title="Solicitudes por estado"
              subtitle="Volumen de tramites de servicio."
              columns={[
                { header: 'Estado', value: (row) => row.estado },
                { header: 'Cantidad', value: (row) => row.cantidad, align: 'right' }
              ]}
              rows={requestRows}
            />

            <ReportTable
              title="Servicios asignados"
              subtitle="Distribucion por tipo de servicio."
              columns={[
                { header: 'Servicio', value: (row) => row.servicio },
                { header: 'Activos', value: (row) => row.activos, align: 'right' },
                { header: 'Inactivos', value: (row) => row.inactivos, align: 'right' },
                { header: 'Total', value: (row) => row.total, align: 'right' }
              ]}
              rows={serviceRows}
            />

            <ReportTable
              title="Reclamos por estado"
              subtitle="Resumen del circuito de atencion."
              columns={[
                { header: 'Estado', value: (row) => row.estado },
                { header: 'Cantidad', value: (row) => row.cantidad, align: 'right' }
              ]}
              rows={claimRows}
            />
          </div>

          <ReportTable
            title="Actividad reciente"
            subtitle="Ultimos movimientos combinados de facturas, solicitudes y reclamos."
            columns={[
              { header: 'Tipo', value: (row) => row.tipo },
              { header: 'Socio', value: (row) => row.socio },
              { header: 'Detalle', value: (row) => row.detalle },
              { header: 'Estado', value: (row) => row.estado },
              { header: 'Fecha', value: (row) => (row.fecha ? formatDate(row.fecha, 'es-AR') : '-') }
            ]}
            rows={recentActivityRows}
          />

          <ReportTable
            title="Facturas recientes"
            columns={[
              { header: 'Factura', value: (bill) => `#${bill.id}` },
              { header: 'Socio', value: (bill) => bill.socioNombre || 'Socio' },
              { header: 'Estado', value: (bill) => bill.status },
              { header: 'Monto', value: (bill) => formatMoney(bill.amount), align: 'right' }
            ]}
            rows={bills.slice(0, 10)}
          />
        </>
      )}
    </div>
  )
}
