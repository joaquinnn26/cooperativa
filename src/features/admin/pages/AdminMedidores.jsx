import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Search,
  Table
} from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { exportTable } from '@/utils/exportTable.js'
import { formatDate } from '@/utils/formatDate.js'
import { isInternetService, normalizeServiceText, serviceRequiresInstallation, serviceRequiresMeter } from '@/utils/serviceInstallation.js'

function normalizeServiceName(nombre) {
  return normalizeServiceText(nombre)
}

function inferredMeterTypeLabel(serviceName) {
  if (isInternetService(serviceName)) return 'Internet sin medidor'
  return normalizeServiceName(serviceName).includes('agua') ? 'Agua' : 'Electrico'
}

function statusStyles(status) {
  return status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
}

const MEDIDORES_EXPORT_COLUMNS = [
  { header: 'Numero', value: (meter) => meter.NumeroMedidor },
  { header: 'Socio', value: (meter) => meter.socioNombre },
  { header: 'Documento', value: (meter) => meter.socioUsuario },
  { header: 'Servicio', value: (meter) => meter.servicioNombre },
  { header: 'Tipo', value: (meter) => meter.TipoMedidor },
  { header: 'Fecha de instalacion', value: (meter) => formatDate(meter.FechaInstalacion, 'es-AR') },
  { header: 'Estado', value: (meter) => meter.Estado }
]

export default function AdminMedidores() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchAllServiceAssignments = useServiceWorkflowStore((state) => state.fetchAllServiceAssignments)
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)

  const [meters, setMeters] = useState([])
  const [serviceAssignments, setServiceAssignments] = useState([])
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [serviceFilter, setServiceFilter] = useState('todos')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exporting, setExporting] = useState(null)

  const loadData = async () => {
    const [metersData, assignmentsData, requestsData] = await Promise.all([
      fetchMeters(),
      fetchAllServiceAssignments(),
      fetchServiceRequests()
    ])
    setMeters(metersData || [])
    setServiceAssignments(assignmentsData || [])
    setRequests(requestsData || [])
  }

  useEffect(() => {
    loadData()
  }, [fetchAllServiceAssignments, fetchMeters, fetchServiceRequests])

  const installationCandidates = useMemo(() => {
    const approvedRequests = requests.filter(
      (request) =>
        serviceRequiresInstallation(request.servicioNombre) &&
        normalizeServiceName(request.estado) === 'aprobada'
    )

    return approvedRequests
      .map((request) => {
        const assignment = serviceAssignments.find(
          (item) =>
            String(item.idSocio) === String(request.idSocio) &&
            String(item.idServicio) === String(request.idServicio) &&
            item.estado === 'Activo'
        )

        if (!assignment) return null

        const requiresMeter = serviceRequiresMeter(request.servicioNombre)
        const alreadyHasMeter = requiresMeter && meters.some((meter) => {
          const sameAssignment =
            meter.idServicioSocio != null &&
            String(meter.idServicioSocio) === String(assignment.idServicioSocio) &&
            meter.Estado !== 'Inactivo'

          const sameSocioAndService =
            String(meter.socioUsuario || '') === String(request.socioUsuario || assignment.socioUsuario || '') &&
            normalizeServiceName(meter.servicioNombre) === normalizeServiceName(request.servicioNombre || assignment.servicioNombre) &&
            meter.Estado !== 'Inactivo'

          return sameAssignment || sameSocioAndService
        })

        if (alreadyHasMeter) return null

        return {
          requestId: request.idSolicitudServicio,
          idServicioSocio: assignment.idServicioSocio,
          idSocio: request.idSocio,
          idServicio: request.idServicio,
          socioNombre: request.socioNombre || assignment.socioNombre,
          socioUsuario: request.socioUsuario || assignment.socioUsuario,
          servicioNombre: request.servicioNombre || assignment.servicioNombre,
          fechaSolicitud: request.fechaSolicitud,
          direccion: request.direccion || 'Sin direccion informada',
          tipoSugerido: inferredMeterTypeLabel(request.servicioNombre),
          requiereMedidor: requiresMeter
        }
      })
      .filter(Boolean)
  }, [meters, requests, serviceAssignments])

  const serviceOptions = useMemo(
    () => Array.from(new Set(meters.map((meter) => meter.servicioNombre).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [meters]
  )

  const filteredMeters = useMemo(() => {
    const query = search.trim().toLowerCase()

    return meters
      .filter((meter) => {
        if (statusFilter === 'activos') return meter.Estado === 'Activo'
        if (statusFilter === 'inactivos') return meter.Estado !== 'Activo'
        return true
      })
      .filter((meter) => serviceFilter === 'todos' || meter.servicioNombre === serviceFilter)
      .filter((meter) =>
        [
          meter.NumeroMedidor,
          meter.socioNombre,
          meter.socioUsuario,
          meter.servicioNombre,
          meter.TipoMedidor,
          meter.Estado
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
  }, [meters, search, serviceFilter, statusFilter])

  const summary = useMemo(
    () => ({
      total: meters.length,
      activos: meters.filter((meter) => meter.Estado === 'Activo').length,
      inactivos: meters.filter((meter) => meter.Estado !== 'Activo').length,
      pendientes: installationCandidates.length
    }),
    [installationCandidates.length, meters]
  )

  const totalPages = Math.max(1, Math.ceil(filteredMeters.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedMeters = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMeters.slice(start, start + pageSize)
  }, [currentPage, filteredMeters, pageSize])

  const resetToFirstPage = (callback) => {
    setPage(1)
    callback()
  }

  const exportar = async (tipo) => {
    if (!filteredMeters.length) {
      addNotification({
        title: 'Sin datos',
        message: 'No hay medidores para exportar con los filtros actuales.',
        type: 'info'
      })
      return
    }

    try {
      setExporting(tipo)
      await exportTable({
        type: tipo,
        filename: 'gestion-instalacion',
        title: 'Gestion de instalacion',
        columns: MEDIDORES_EXPORT_COLUMNS,
        rows: filteredMeters
      })
    } catch (error) {
      addNotification({
        title: 'Error al exportar',
        message: error.message || 'No se pudo generar el archivo.',
        type: 'error'
      })
    } finally {
      setExporting(null)
    }
  }

  const pagination = (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {paginatedMeters.length ? (currentPage - 1) * pageSize + 1 : 0}-
        {Math.min(currentPage * pageSize, filteredMeters.length)} de {filteredMeters.length}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(1)
          }}
          className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
          aria-label="Cantidad de medidores por pagina"
        >
          <option value={10}>10 por pagina</option>
          <option value={25}>25 por pagina</option>
          <option value={50}>50 por pagina</option>
        </select>
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm font-medium text-gray-700">
          {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion de instalacion</h1>
            <p className="mt-1 max-w-3xl text-gray-600">Consulta las instalaciones y medidores registrados. La aprobacion de documentacion se gestiona desde solicitudes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => exportar('PDF')}
              disabled={Boolean(exporting)}
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              {exporting === 'PDF' ? 'Generando...' : 'PDF'}
            </button>
            <button
              className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => exportar('Excel')}
              disabled={Boolean(exporting)}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              {exporting === 'Excel' ? 'Generando...' : 'Excel'}
            </button>
            <button
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => exportar('PSV')}
              disabled={Boolean(exporting)}
            >
              <Table className="mr-1.5 h-4 w-4" />
              {exporting === 'PSV' ? 'Generando...' : 'PSV'}
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('todos'))}
          className={`rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusFilter === 'todos' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Instalados</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
          <p className="mt-1 text-xs text-gray-500">Total de medidores registrados</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('activos'))}
          className={`rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusFilter === 'activos' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.activos}</p>
          <p className="mt-1 text-xs text-gray-500">Disponibles para medicion</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('inactivos'))}
          className={`rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusFilter === 'inactivos' ? 'border-slate-500 bg-slate-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Inactivos</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{summary.inactivos}</p>
          <p className="mt-1 text-xs text-gray-500">Suspendidos o dados de baja</p>
        </button>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-700">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{summary.pendientes}</p>
          <p className="mt-1 text-xs text-amber-700">Solicitudes aprobadas sin completar</p>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Medidores instalados</h2>
                <p className="text-sm text-gray-500">Consulta, filtra y exporta el listado operativo.</p>
              </div>
              <span className="text-sm text-gray-500">
                {filteredMeters.length} resultado{filteredMeters.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 border-b border-gray-100 px-4 py-4 lg:grid-cols-[minmax(260px,1fr)_180px_220px] lg:items-center">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar medidor, socio, documento, servicio o tipo"
                className="w-full min-w-0 text-sm outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => resetToFirstPage(() => setStatusFilter(event.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(event) => resetToFirstPage(() => setServiceFilter(event.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos los servicios</option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {paginatedMeters.map((meter) => (
              <div key={meter.idMedidor} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                    <p className="truncate text-sm text-gray-600">{meter.socioNombre || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500">{meter.socioUsuario || 'Sin documento'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(meter.Estado)}`}>
                    {meter.Estado}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Servicio</p>
                    <p className="font-medium text-gray-900">{meter.servicioNombre}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Tipo</p>
                    <p className="font-medium text-gray-900">{meter.TipoMedidor}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase text-gray-500">Instalacion</p>
                    <p className="font-medium text-gray-900">{formatDate(meter.FechaInstalacion, 'es-AR')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Medidor</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Instalacion</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMeters.map((meter) => (
                  <tr key={meter.idMedidor} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                      <p className="text-xs text-gray-500">#{meter.idMedidor}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{meter.socioNombre || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{meter.socioUsuario || 'Sin documento'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{meter.servicioNombre}</td>
                    <td className="px-4 py-3 text-gray-700">{meter.TipoMedidor}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(meter.FechaInstalacion, 'es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(meter.Estado)}`}>
                        {meter.Estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!filteredMeters.length ? (
            <div className="px-4 py-12 text-center text-gray-500">
              {search ? 'No hay medidores que coincidan con la busqueda.' : 'Todavia no hay medidores instalados.'}
            </div>
          ) : null}

          {pagination}
        </div>
      </section>

    </div>
  )
}
