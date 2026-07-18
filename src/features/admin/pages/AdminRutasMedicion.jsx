import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  PlusCircle,
  Search,
  Table,
  UserRoundCheck,
  X
} from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { exportTable } from '@/utils/exportTable.js'
import { formatDate } from '@/utils/formatDate.js'
import { getAssignableRouteEmployees, isMeterReader } from '@/utils/measurementRoute.js'
import { cleanText, FIELD_LIMITS, firstValidationError, isPositiveNumber, isTodayOrFuture, validateMeaningfulText } from '@/utils/validation.js'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function isActiveMeter(meter) {
  return normalizeText(meter?.Estado) === 'activo'
}

function monthKey(value) {
  const text = String(value || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
  return text.slice(0, 7)
}

function employeeName(employee) {
  return [employee?.Persona?.Apellido, employee?.Persona?.Nombre].filter(Boolean).join(', ') || 'Empleado'
}

function routeProgress(route) {
  const total = route.items?.length || 0
  const done = route.items?.filter((item) => item.estado === 'Medido').length || 0
  const percent = total ? Math.round((done / total) * 100) : 0
  return { total, done, percent }
}

function routeSearchText(route) {
  return [
    route.nombre,
    route.estado,
    route.empleadoNombre,
    route.idEmpleado,
    route.fecha
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const ROUTES_EXPORT_COLUMNS = [
  { header: 'Nombre', value: (route) => route.nombre },
  { header: 'Fecha', value: (route) => formatDate(route.fecha, 'es-AR') },
  { header: 'Empleado', value: (route) => route.empleadoNombre || `Empleado ${route.idEmpleado}` },
  { header: 'Estado', value: (route) => route.estado },
  { header: 'Medidores', value: (route) => routeProgress(route).total },
  { header: 'Medidos', value: (route) => routeProgress(route).done },
  { header: 'Avance', value: (route) => `${routeProgress(route).percent}%` }
]

export default function AdminRutasMedicion() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchMeasurementRoutes = useServiceWorkflowStore((state) => state.fetchMeasurementRoutes)
  const createMeasurementRoute = useServiceWorkflowStore((state) => state.createMeasurementRoute)
  const { fetchEmpleados } = useEmpleados(false)

  const [meters, setMeters] = useState([])
  const [routes, setRoutes] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedMeterIds, setSelectedMeterIds] = useState([])
  const [routeName, setRouteName] = useState('')
  const [routeDate, setRouteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('todos')
  const [selectionFilter, setSelectionFilter] = useState('todos')
  const [meterPage, setMeterPage] = useState(1)
  const [meterPageSize, setMeterPageSize] = useState(10)
  const [routeSearch, setRouteSearch] = useState('')
  const [routeStatusFilter, setRouteStatusFilter] = useState('todos')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setLoadError('')

    try {
      const [metersData, employeesData, routesData] = await Promise.all([
        fetchMeters({ throwOnError: true }),
        fetchEmpleados({ throwOnError: true }),
        fetchMeasurementRoutes({ throwOnError: true })
      ])

      const assignableEmployees = getAssignableRouteEmployees(employeesData)
      const activeMeters = (metersData || []).filter(isActiveMeter)

      setMeters(activeMeters)
      setEmployees(assignableEmployees)
      setRoutes(routesData || [])

      if (!selectedEmployeeId && assignableEmployees[0]?.idEmpleado != null) {
        setSelectedEmployeeId(String(assignableEmployees[0].idEmpleado))
      }

      if (!assignableEmployees.length) {
        setLoadError('No hay empleados activos disponibles para asignar la ruta.')
      } else if (!activeMeters.length) {
        setLoadError('No hay medidores activos disponibles para incluir en una ruta.')
      }
    } catch (error) {
      const message = error.message || 'No se pudieron cargar los datos necesarios para armar la ruta.'
      setLoadError(message)
      addNotification({
        title: 'No se puede preparar la ruta',
        message,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.idEmpleado) === String(selectedEmployeeId)) || null,
    [employees, selectedEmployeeId]
  )

  const unavailableMeterIds = useMemo(() => {
    const targetMonth = monthKey(routeDate)
    if (!targetMonth) return new Set()

    const ids = new Set()
    routes.forEach((route) => {
      if (monthKey(route.fecha) !== targetMonth) return
      if (normalizeText(route.estado) === 'cancelada') return

      ;(route.items || []).forEach((item) => {
        if (item.idMedidor != null) ids.add(String(item.idMedidor))
      })
    })

    return ids
  }, [routeDate, routes])

  const availableMeters = useMemo(
    () => meters.filter((meter) => !unavailableMeterIds.has(String(meter.idMedidor))),
    [meters, unavailableMeterIds]
  )

  useEffect(() => {
    setSelectedMeterIds((current) => current.filter((id) => !unavailableMeterIds.has(String(id))))
  }, [unavailableMeterIds])

  const selectedIdSet = useMemo(() => new Set(selectedMeterIds.map(String)), [selectedMeterIds])

  const selectedMeters = useMemo(
    () =>
      selectedMeterIds
        .map((id) => availableMeters.find((meter) => String(meter.idMedidor) === String(id)))
        .filter(Boolean),
    [availableMeters, selectedMeterIds]
  )

  const serviceOptions = useMemo(
    () => Array.from(new Set(availableMeters.map((meter) => meter.servicioNombre).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [availableMeters]
  )

  const filteredMeters = useMemo(() => {
    const query = search.trim().toLowerCase()

    return availableMeters
      .filter((meter) => serviceFilter === 'todos' || meter.servicioNombre === serviceFilter)
      .filter((meter) => {
        if (selectionFilter === 'seleccionados') return selectedIdSet.has(String(meter.idMedidor))
        if (selectionFilter === 'sin-seleccionar') return !selectedIdSet.has(String(meter.idMedidor))
        return true
      })
      .filter((meter) =>
        [
          meter.NumeroMedidor,
          meter.socioNombre,
          meter.socioUsuario,
          meter.servicioNombre,
          meter.TipoMedidor
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
  }, [availableMeters, search, selectedIdSet, selectionFilter, serviceFilter])

  const meterTotalPages = Math.max(1, Math.ceil(filteredMeters.length / meterPageSize))
  const meterCurrentPage = Math.min(meterPage, meterTotalPages)
  const paginatedMeters = useMemo(() => {
    const start = (meterCurrentPage - 1) * meterPageSize
    return filteredMeters.slice(start, start + meterPageSize)
  }, [filteredMeters, meterCurrentPage, meterPageSize])

  const routeStatuses = useMemo(
    () => Array.from(new Set(routes.map((route) => route.estado).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [routes]
  )

  const filteredRoutes = useMemo(() => {
    const query = routeSearch.trim().toLowerCase()

    return routes
      .filter((route) => routeStatusFilter === 'todos' || route.estado === routeStatusFilter)
      .filter((route) => !query || routeSearchText(route).includes(query))
  }, [routeSearch, routeStatusFilter, routes])

  const summary = useMemo(() => {
    const finishedRoutes = routes.filter((route) => normalizeText(route.estado) === 'finalizada').length
    return {
      meters: availableMeters.length,
      selected: selectedMeterIds.length,
      employees: employees.length,
      routes: routes.length,
      activeRoutes: Math.max(routes.length - finishedRoutes, 0)
    }
  }, [availableMeters.length, employees.length, routes, selectedMeterIds.length])

  const toggleMeter = (meterId) => {
    setSelectedMeterIds((current) =>
      current.includes(String(meterId))
        ? current.filter((id) => id !== String(meterId))
        : [...current, String(meterId)]
    )
  }

  const selectVisibleMeters = () => {
    setSelectedMeterIds((current) => {
      const next = new Set(current)
      filteredMeters.forEach((meter) => next.add(String(meter.idMedidor)))
      return Array.from(next)
    })
  }

  const clearSelection = () => setSelectedMeterIds([])

  const resetMeterPage = (callback) => {
    setMeterPage(1)
    callback()
  }

  const handleCreateRoute = async (event) => {
    event.preventDefault()

    const normalizedName = cleanText(routeName) || `Ruta ${formatDate(routeDate, 'es-AR')}`
    const validationError = firstValidationError([
      validateMeaningfulText(normalizedName, 'El nombre de la hoja', FIELD_LIMITS.routeName),
      !isTodayOrFuture(routeDate) ? 'La fecha de la hoja debe ser hoy o posterior.' : '',
      !isPositiveNumber(selectedEmployeeId) ? 'Selecciona un empleado activo.' : '',
      !selectedMeters.length ? 'Selecciona al menos un medidor activo.' : '',
      selectedMeterIds.some((id) => unavailableMeterIds.has(String(id))) ? 'Hay medidores seleccionados que ya tienen ruta en ese mes.' : '',
      loadError ? `No se puede crear la ruta: ${loadError}` : ''
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    setSaving(true)

    try {
      await createMeasurementRoute({
        nombre: normalizedName,
        fecha: routeDate,
        idEmpleado: Number(selectedEmployeeId),
        empleadoNombre: employeeName(selectedEmployee),
        meters: selectedMeters
      })

      addNotification({
        title: 'Hoja de ruta creada',
        message: 'La ruta fue creada y asignada correctamente.',
        type: 'success'
      })

      setRouteName('')
      setSelectedMeterIds([])
      setLoadError('')
      const updatedRoutes = await fetchMeasurementRoutes({ throwOnError: true })
      setRoutes(updatedRoutes || [])
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo crear la hoja de ruta.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const exportRoutes = async (tipo) => {
    if (!filteredRoutes.length) {
      addNotification({
        title: 'Sin datos',
        message: 'No hay hojas de ruta para exportar con los filtros actuales.',
        type: 'info'
      })
      return
    }

    try {
      setExporting(tipo)
      await exportTable({
        type: tipo,
        filename: 'rutas-medicion',
        title: 'Rutas de medicion',
        columns: ROUTES_EXPORT_COLUMNS,
        rows: filteredRoutes
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

  const meterPagination = (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {paginatedMeters.length ? (meterCurrentPage - 1) * meterPageSize + 1 : 0}-
        {Math.min(meterCurrentPage * meterPageSize, filteredMeters.length)} de {filteredMeters.length}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={meterPageSize}
          onChange={(event) => {
            setMeterPageSize(Number(event.target.value))
            setMeterPage(1)
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
          onClick={() => setMeterPage((value) => Math.max(1, value - 1))}
          disabled={meterCurrentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm font-medium text-gray-700">
          {meterCurrentPage}/{meterTotalPages}
        </span>
        <button
          type="button"
          onClick={() => setMeterPage((value) => Math.min(meterTotalPages, value + 1))}
          disabled={meterCurrentPage === meterTotalPages}
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
      <header className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-600">Mediciones en campo</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">Rutas de medicion</h1>
            <p className="mt-1 max-w-3xl text-gray-600">Crea una hoja, selecciona medidores activos y controla el avance de las rutas ya asignadas.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex w-fit items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
      </header>

      {loadError ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            {loading ? 'Reintentando...' : 'Reintentar carga'}
          </button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Medidores activos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.meters}</p>
          <p className="mt-1 text-xs text-gray-500">Disponibles para {monthKey(routeDate) || 'el mes elegido'}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase text-blue-700">Seleccionados</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{summary.selected}</p>
          <p className="mt-1 text-xs text-blue-700">Van en la nueva hoja</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-700">Empleados</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{summary.employees}</p>
          <p className="mt-1 text-xs text-emerald-700">Habilitados para asignar</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Hojas creadas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.routes}</p>
          <p className="mt-1 text-xs text-gray-500">Total historico</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase text-amber-700">En seguimiento</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{summary.activeRoutes}</p>
          <p className="mt-1 text-xs text-amber-700">Pendientes o en proceso</p>
        </div>
      </section>

      <form onSubmit={handleCreateRoute} className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">1</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Datos de la nueva hoja</h2>
              <p className="mt-1 text-sm text-gray-500">Primero define nombre, fecha y empleado responsable. Despues selecciona los medidores.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(180px,1fr)_180px_minmax(240px,1fr)_220px] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nombre</label>
            <input
            value={routeName}
            onChange={(event) => setRouteName(event.target.value)}
            minLength={FIELD_LIMITS.routeName.min}
            maxLength={FIELD_LIMITS.routeName.max}
            className="input-field"
              placeholder="Ej: Zona norte - agua"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              value={routeDate}
              onChange={(event) => setRouteDate(event.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Empleado responsable</label>
            <select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              className="input-field"
              required
            >
              <option value="">Seleccionar empleado...</option>
              {employees.map((employee) => (
                <option key={employee.idEmpleado} value={employee.idEmpleado}>
                  {employeeName(employee)} - {employee.Cargo?.Nombre || 'Sin cargo'}
                  {isMeterReader(employee) ? ' (Lecturista)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            {loading ? 'Cargando...' : saving ? 'Creando...' : 'Crear ruta'}
          </button>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex flex-col gap-2 text-sm text-gray-700 lg:flex-row lg:items-center lg:justify-between">
            <span>
              <strong>{selectedMeters.length}</strong> medidores seleccionados
              {selectedEmployee ? ` - Responsable: ${employeeName(selectedEmployee)}` : ' - Responsable sin asignar'}
            </span>
            {selectedEmployee && !isMeterReader(selectedEmployee) ? (
              <span className="text-amber-700">El empleado no tiene cargo Lecturista; verifica que pueda ejecutar la ruta.</span>
            ) : null}
          </div>
        </div>
      </form>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">2</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Seleccionar medidores</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Solo se muestran medidores sin ruta en el mes seleccionado. Cada medidor se mide una vez por mes.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectVisibleMeters}
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Seleccionar visibles
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar seleccion
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-gray-100 px-4 py-4 lg:grid-cols-[minmax(260px,1fr)_200px_210px_130px] lg:items-center">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setMeterPage(1)
              }}
              placeholder="Buscar medidor, socio, documento, servicio o tipo"
              className="w-full min-w-0 text-sm outline-none"
            />
          </div>
          <select
            value={serviceFilter}
            onChange={(event) => resetMeterPage(() => setServiceFilter(event.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="todos">Todos los servicios</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <select
            value={selectionFilter}
            onChange={(event) => resetMeterPage(() => setSelectionFilter(event.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="todos">Todos</option>
            <option value="seleccionados">Seleccionados</option>
            <option value="sin-seleccionar">Sin seleccionar</option>
          </select>
          <p className="text-sm text-gray-500">{filteredMeters.length} resultado{filteredMeters.length === 1 ? '' : 's'}</p>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Medidor</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMeters.map((meter) => {
                const checked = selectedIdSet.has(String(meter.idMedidor))
                const order = selectedMeterIds.indexOf(String(meter.idMedidor)) + 1

                return (
                  <tr key={meter.idMedidor} className={`border-t border-gray-100 hover:bg-gray-50/70 ${checked ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      {checked ? (
                        <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">#{order}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                      <p className="text-xs text-gray-500">#{meter.idMedidor}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{meter.socioNombre || 'Socio sin nombre'}</p>
                      <p className="text-xs text-gray-500">{meter.socioUsuario || 'Sin documento'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{meter.servicioNombre}</td>
                    <td className="px-4 py-3 text-gray-700">{meter.TipoMedidor}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleMeter(meter.idMedidor)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                          checked ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {checked ? 'Quitar' : 'Agregar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {paginatedMeters.map((meter) => {
            const checked = selectedIdSet.has(String(meter.idMedidor))
            return (
              <button
                key={meter.idMedidor}
                type="button"
                onClick={() => toggleMeter(meter.idMedidor)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                    <p className="text-sm text-gray-600">{meter.socioNombre || 'Socio sin nombre'}</p>
                    <p className="mt-1 text-xs text-gray-500">Doc. {meter.socioUsuario || 'Sin documento'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${checked ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {checked ? `#${selectedMeterIds.indexOf(String(meter.idMedidor)) + 1}` : meter.Estado}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                  <span>{meter.servicioNombre}</span>
                  <span>{meter.TipoMedidor}</span>
                </div>
              </button>
            )
          })}
        </div>

        {!filteredMeters.length ? (
          <div className="px-4 py-12 text-center text-gray-500">
            No hay medidores activos disponibles para ese mes o que coincidan con la busqueda.
          </div>
        ) : null}

        {meterPagination}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">3</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Hojas creadas</h2>
                <p className="mt-1 text-sm text-gray-500">Revisa responsable, fecha, estado y avance de cada hoja de ruta.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportRoutes('PDF')}
                disabled={Boolean(exporting)}
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <FileDown className="mr-1.5 h-4 w-4" />
                PDF
              </button>
              <button
                type="button"
                onClick={() => exportRoutes('Excel')}
                disabled={Boolean(exporting)}
                className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                Excel
              </button>
              <button
                type="button"
                onClick={() => exportRoutes('PSV')}
                disabled={Boolean(exporting)}
                className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Table className="mr-1.5 h-4 w-4" />
                PSV
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px]">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={routeSearch}
                onChange={(event) => setRouteSearch(event.target.value)}
                placeholder="Buscar hoja, empleado o estado"
                className="w-full min-w-0 text-sm outline-none"
              />
            </div>
            <select
              value={routeStatusFilter}
              onChange={(event) => setRouteStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              {routeStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredRoutes.map((route) => {
            const progress = routeProgress(route)

            return (
              <div key={route.idRutaMedicion} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{route.nombre}</p>
                    <p className="text-sm text-gray-500">{formatDate(route.fecha, 'es-AR')}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {route.estado}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <UserRoundCheck className="h-4 w-4" />
                  <span className="truncate">{route.empleadoNombre || `Empleado ${route.idEmpleado}`}</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>{progress.done}/{progress.total} medidores</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>
              </div>
            )
          })}

          {!filteredRoutes.length ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 lg:col-span-2 xl:col-span-3">
              Todavia no hay hojas de ruta que coincidan con los filtros.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
