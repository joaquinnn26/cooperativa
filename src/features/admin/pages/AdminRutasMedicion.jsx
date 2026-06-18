import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, MapPinned, PlusCircle, Search, UserRoundCheck, X } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { formatDate } from '@/utils/formatDate.js'
import { getAssignableRouteEmployees, isMeterReader } from '@/utils/measurementRoute.js'
import { cleanText, firstValidationError, isPositiveNumber, isTodayOrFuture, validateRequired } from '@/utils/validation.js'

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

function employeeName(employee) {
  return [employee?.Persona?.Apellido, employee?.Persona?.Nombre].filter(Boolean).join(', ') || 'Empleado'
}

function routeProgress(route) {
  const total = route.items?.length || 0
  const done = route.items?.filter((item) => item.estado === 'Medido').length || 0
  return { total, done }
}

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
  const [saving, setSaving] = useState(false)
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

  const filteredMeters = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return meters

    return meters.filter((meter) =>
      [meter.NumeroMedidor, meter.socioNombre, meter.socioUsuario, meter.servicioNombre, meter.TipoMedidor]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [meters, search])

  const selectedMeters = useMemo(
    () =>
      selectedMeterIds
        .map((id) => meters.find((meter) => String(meter.idMedidor) === String(id)))
        .filter(Boolean),
    [meters, selectedMeterIds]
  )

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

  const handleCreateRoute = async (event) => {
    event.preventDefault()

    const normalizedName = cleanText(routeName) || `Ruta ${formatDate(routeDate, 'es-AR')}`
    const validationError = firstValidationError([
      validateRequired(normalizedName, 'El nombre de la hoja'),
      !isTodayOrFuture(routeDate) ? 'La fecha de la hoja debe ser hoy o posterior.' : '',
      !isPositiveNumber(selectedEmployeeId) ? 'Selecciona un empleado activo.' : '',
      !selectedMeters.length ? 'Selecciona al menos un medidor activo.' : '',
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-600">Mediciones en campo</p>
          <h1 className="text-3xl font-bold text-gray-900">Rutas de medicion</h1>
          <p className="mt-2 text-gray-600">Arma hojas de ruta con medidores activos y asignalas a un empleado.</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900">
          <p className="text-xs font-semibold uppercase text-blue-700">Medidores seleccionados</p>
          <p className="mt-1 text-2xl font-bold">{selectedMeterIds.length}</p>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Medidores activos</h2>
                <p className="mt-1 text-sm text-gray-500">Selecciona en el orden en que queres que aparezcan en la hoja.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar medidor, socio o servicio..."
                  className="w-full min-w-0 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectVisibleMeters}
                className="inline-flex items-center rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Seleccionar visibles
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {filteredMeters.map((meter) => {
              const checked = selectedMeterIds.includes(String(meter.idMedidor))

              return (
                <button
                  key={meter.idMedidor}
                  type="button"
                  onClick={() => toggleMeter(meter.idMedidor)}
                  className={`rounded-lg border p-4 text-left transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                      <p className="text-sm text-gray-600">{meter.socioNombre || 'Socio sin nombre'}</p>
                      <p className="mt-1 text-xs text-gray-500">Doc. {meter.socioUsuario || 'Sin documento'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${checked ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      {checked ? `#{selectedMeterIds.indexOf(String(meter.idMedidor)) + 1}` : meter.Estado}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <span>{meter.servicioNombre}</span>
                    <span>{meter.TipoMedidor}</span>
                  </div>
                </button>
              )
            })}

            {!filteredMeters.length ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500 lg:col-span-2">
                No hay medidores activos que coincidan con la busqueda.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <form onSubmit={handleCreateRoute} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <MapPinned className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nueva hoja</h2>
                <p className="text-sm text-gray-500">El administrador selecciona al responsable de la ruta.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  value={routeName}
                  onChange={(event) => setRouteName(event.target.value)}
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

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">Resumen</p>
                <p className="mt-2 text-sm text-gray-700">{selectedMeters.length} medidores activos seleccionados.</p>
                <p className="mt-1 text-sm text-gray-700">
                  Responsable: {selectedEmployee ? employeeName(selectedEmployee) : 'Sin asignar'}
                </p>
                {selectedEmployee && !isMeterReader(selectedEmployee) ? (
                  <p className="mt-2 text-xs text-amber-700">
                    El empleado no tiene cargo Lecturista. El administrador puede asignarlo, pero debe contar con acceso operativo para ejecutarla.
                  </p>
                ) : null}
              </div>

              {!employees.length ? (
                <p className="text-sm text-amber-700">No hay empleados activos disponibles.</p>
              ) : null}

              <button
                type="submit"
                disabled={loading || saving}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {loading ? 'Cargando datos...' : saving ? 'Creando...' : 'Crear hoja de ruta'}
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-bold text-gray-900">Hojas creadas</h2>
            </div>

            <div className="space-y-3">
              {routes.map((route) => {
                const progress = routeProgress(route)

                return (
                  <div key={route.idRutaMedicion} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{route.nombre}</p>
                        <p className="text-sm text-gray-500">{formatDate(route.fecha, 'es-AR')}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {route.estado}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <UserRoundCheck className="h-4 w-4" />
                      {route.empleadoNombre || `Empleado ${route.idEmpleado}`}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {progress.done}/{progress.total} medidores medidos
                    </p>
                  </div>
                )
              })}

              {!routes.length ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  Todavia no hay hojas de ruta creadas.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
