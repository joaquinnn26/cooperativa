import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Droplet,
  FileDown,
  FileSpreadsheet,
  Gauge,
  History,
  Save,
  Search,
  Table,
  Zap
} from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useCurrentEmpleado } from '@/hooks/useCurrentEmpleado.js'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { cargoMatches } from '@/utils/auth.js'
import { exportTable } from '@/utils/exportTable.js'
import { formatDate } from '@/utils/formatDate.js'
import { firstValidationError, isNonNegativeNumber, isPositiveNumber, isTodayOrPast, isValidDate } from '@/utils/validation.js'

const initialForm = {
  idMedidor: '',
  idTipoLectura: '1',
  FechaLectura: '',
  LecturaActual: ''
}

const HISTORY_EXPORT_COLUMNS = [
  { header: 'Fecha', value: (measurement) => formatDate(measurement.FechaLectura, 'es-AR') },
  { header: 'Medidor', value: (measurement) => measurement.NumeroMedidor },
  { header: 'Servicio', value: (measurement) => measurement.servicioNombre },
  { header: 'Lectura anterior', value: (measurement) => measurement.LecturaAnterior },
  { header: 'Lectura actual', value: (measurement) => measurement.LecturaActual },
  { header: 'Consumo', value: (measurement) => measurement.Consumo },
  { header: 'Tipo', value: (measurement) => measurement.TipoLectura },
  { header: 'Empleado', value: (measurement) => measurement.EmpleadoUsuario || 'No informado' }
]

function serviceIcon(serviceName) {
  return String(serviceName).toLowerCase().includes('agua') ? Droplet : Zap
}

function isLecturista(employee) {
  const cargo = String(employee?.Cargo?.Nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  return cargo.includes('lecturista')
}

function employeeFullName(employee) {
  return [employee?.Persona?.Apellido, employee?.Persona?.Nombre].filter(Boolean).join(', ') || 'Empleado'
}

function compactDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function EmpleadoMediciones({ adminMode = false }) {
  const HISTORY_PAGE_SIZE = 8
  const addNotification = useAppStore((state) => state.addNotification)
  const idEmpleado = useAuthStore((state) => state.idEmpleado)
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const rol = useAuthStore((state) => state.rol)
  const cargo = useAuthStore((state) => state.cargo)
  const { empleadoId, loadingEmpleado, resolveEmpleadoId } = useCurrentEmpleado()
  const { fetchEmpleados } = useEmpleados(false)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchMeasurementTypes = useServiceWorkflowStore((state) => state.fetchMeasurementTypes)
  const fetchMeasurementsByMeter = useServiceWorkflowStore((state) => state.fetchMeasurementsByMeter)
  const createMeasurement = useServiceWorkflowStore((state) => state.createMeasurement)

  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('todos')
  const [meterPage, setMeterPage] = useState(1)
  const [meterPageSize, setMeterPageSize] = useState(10)
  const [meters, setMeters] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(initialForm)
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [measurementTypes, setMeasurementTypes] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(null)
  const selectedMeterIdRef = useRef('')

  useEffect(() => {
    selectedMeterIdRef.current = String(form.idMedidor || '')
  }, [form.idMedidor])

  useEffect(() => {
    fetchMeters().then((data) => {
      const activeMeters = data.filter((meter) => meter.Estado === 'Activo')
      setMeters(activeMeters)
      if (activeMeters.length) {
        setForm((prev) => ({
          ...prev,
          idMedidor: String(activeMeters[0].idMedidor),
          FechaLectura: compactDate()
        }))
      }
    })
  }, [fetchMeters])

  useEffect(() => {
    fetchMeasurementTypes().then((data) => {
      const normalized = (data || []).map((item) => ({
        id: String(item.idTipoLectura),
        label: item.Nombre
      }))
      setMeasurementTypes(normalized)
      if (normalized[0]?.id) {
        setForm((prev) => ({ ...prev, idTipoLectura: normalized[0].id }))
      }
    })
  }, [fetchMeasurementTypes])

  useEffect(() => {
    if (!adminMode) return
    fetchEmpleados().then((data) => {
      const activeLecturistas = (data || []).filter((employee) => employee.Activo && isLecturista(employee))
      setEmployees(activeLecturistas)
      if (activeLecturistas[0]?.idEmpleado != null) {
        setSelectedEmployeeId(String(activeLecturistas[0].idEmpleado))
      }
    })
  }, [adminMode, fetchEmpleados])

  useEffect(() => {
    if (!form.idMedidor) return
    const requestedMeterId = String(form.idMedidor)
    let cancelled = false
    setHistory([])
    setHistoryPage(1)

    fetchMeasurementsByMeter(requestedMeterId).then((data) => {
      if (!cancelled && selectedMeterIdRef.current === requestedMeterId) {
        setHistory(data || [])
      }
    })

    return () => {
      cancelled = true
    }
  }, [fetchMeasurementsByMeter, form.idMedidor])

  const serviceOptions = useMemo(
    () => Array.from(new Set(meters.map((meter) => meter.servicioNombre).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [meters]
  )

  const filteredMeters = useMemo(() => {
    const query = search.trim().toLowerCase()
    return meters
      .filter((meter) => serviceFilter === 'todos' || meter.servicioNombre === serviceFilter)
      .filter((meter) =>
        [meter.NumeroMedidor, meter.socioNombre, meter.socioUsuario, meter.servicioNombre, meter.TipoMedidor]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
  }, [meters, search, serviceFilter])

  const meterTotalPages = Math.max(1, Math.ceil(filteredMeters.length / meterPageSize))
  const meterCurrentPage = Math.min(meterPage, meterTotalPages)
  const paginatedMeters = useMemo(() => {
    const start = (meterCurrentPage - 1) * meterPageSize
    return filteredMeters.slice(start, start + meterPageSize)
  }, [filteredMeters, meterCurrentPage, meterPageSize])

  const selectedMeter = useMemo(
    () => meters.find((meter) => String(meter.idMedidor) === String(form.idMedidor)) ?? null,
    [form.idMedidor, meters]
  )

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.idEmpleado) === String(selectedEmployeeId)) ?? null,
    [employees, selectedEmployeeId]
  )

  const filteredHistory = useMemo(
    () => history.filter((measurement) => String(measurement.idMedidor) === String(form.idMedidor)),
    [form.idMedidor, history]
  )

  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE))
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE
    return filteredHistory.slice(start, start + HISTORY_PAGE_SIZE)
  }, [filteredHistory, historyPage])

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages)
    }
  }, [historyPage, totalHistoryPages])

  const latestMeasurement = filteredHistory[0] ?? null
  const selectedMeasurementType = measurementTypes.find((option) => option.id === form.idTipoLectura)
  const canAccessMeasurements = adminMode || cargoMatches(cargo, 'Lecturista')
  const totalConsumption = filteredHistory.reduce((total, item) => total + Number(item.Consumo || 0), 0)

  const selectMeter = (meter) => {
    setForm((prev) => ({
      ...prev,
      idMedidor: String(meter.idMedidor),
      FechaLectura: prev.FechaLectura || compactDate()
    }))
  }

  const exportHistory = async (tipo) => {
    if (!filteredHistory.length) {
      addNotification({
        title: 'Sin datos',
        message: 'No hay lecturas para exportar en el medidor seleccionado.',
        type: 'info'
      })
      return
    }

    try {
      setExporting(tipo)
      await exportTable({
        type: tipo,
        filename: `lecturas-${selectedMeter?.NumeroMedidor || 'medidor'}`,
        title: `Historial de lecturas ${selectedMeter?.NumeroMedidor || ''}`.trim(),
        columns: HISTORY_EXPORT_COLUMNS,
        rows: filteredHistory
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

  if (!canAccessMeasurements) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Esta vista solo esta disponible para empleados con cargo Lecturista. Tu cargo actual es: {cargo || 'No informado'}.
        </div>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = firstValidationError([
      adminMode && !isPositiveNumber(selectedEmployeeId) ? 'Selecciona un lecturista valido.' : '',
      !isPositiveNumber(form.idMedidor) ? 'Selecciona un medidor valido.' : '',
      !isPositiveNumber(form.idTipoLectura) ? 'Selecciona un tipo de lectura valido.' : '',
      !isValidDate(form.FechaLectura) ? 'La fecha de lectura es obligatoria y debe ser valida.' : '',
      !isTodayOrPast(form.FechaLectura) ? 'La fecha de lectura no puede ser posterior a hoy.' : '',
      !isNonNegativeNumber(form.LecturaActual) ? 'La lectura actual debe ser un numero mayor o igual a cero.' : '',
      latestMeasurement && Number(form.LecturaActual) < Number(latestMeasurement.LecturaActual)
        ? 'La lectura actual no puede ser menor que la ultima lectura registrada.'
        : ''
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    setSaving(true)

    try {
      const resolvedEmpleadoId = adminMode
        ? Number(selectedEmployeeId)
        : empleadoId ?? idEmpleado ?? (await resolveEmpleadoId())

      if (!resolvedEmpleadoId) {
        throw new Error('No se pudo identificar el empleado que registra la lectura.')
      }

      if (!measurementTypes.length) {
        throw new Error('No hay tipos de lectura cargados en el sistema.')
      }

      await createMeasurement({
        idMedidor: Number(form.idMedidor),
        idEmpleado: Number(resolvedEmpleadoId),
        idTipoLectura: Number(form.idTipoLectura),
        FechaLectura: form.FechaLectura,
        LecturaActual: Number(form.LecturaActual),
        tipoLecturaNombre: selectedMeasurementType?.label,
        empleadoUsuario: adminMode ? selectedEmployee?.Persona?.Documento || '' : usuario,
        empleadoNombre: adminMode
          ? `${selectedEmployee?.Persona?.Nombre || ''} ${selectedEmployee?.Persona?.Apellido || ''}`.trim()
          : nombre || usuario
      })

      addNotification({
        title: 'Medicion guardada',
        message: 'La lectura se registro correctamente.',
        type: 'success'
      })

      const targetMeterId = String(form.idMedidor)
      setForm((prev) => ({ ...prev, LecturaActual: '' }))
      fetchMeasurementsByMeter(targetMeterId).then((data) => {
        if (selectedMeterIdRef.current === targetMeterId) {
          setHistory(data || [])
          setHistoryPage(1)
        }
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo guardar la medicion.',
        type: 'error'
      })
    } finally {
      setSaving(false)
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
          onClick={() => setMeterPage((page) => Math.max(1, page - 1))}
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
          onClick={() => setMeterPage((page) => Math.min(meterTotalPages, page + 1))}
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
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-600">{adminMode ? 'Administracion' : 'Lecturista'}</p>
          <h1 className="text-3xl font-bold text-gray-900">{adminMode ? 'Consulta de lecturas' : 'Cargar mediciones'}</h1>
          <p className="mt-1 text-gray-600">
            {adminMode
              ? 'Busca un medidor y revisa el historial de lecturas registradas por lecturistas.'
              : 'Busca el medidor correcto, registra la lectura y revisa el historial sin recorrer listas largas.'}
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Medidores activos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{meters.length}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase text-blue-700">Lecturas del medidor</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{filteredHistory.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-700">Ultima lectura</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{latestMeasurement ? latestMeasurement.LecturaActual : '-'}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase text-amber-700">Consumo acumulado</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{totalConsumption}</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-gray-100 px-4 py-4 lg:grid-cols-[minmax(240px,1fr)_210px_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setMeterPage(1)
                }}
                placeholder="Buscar socio, documento, servicio o medidor..."
                className="w-full min-w-0 text-sm outline-none"
              />
            </div>
            <select
              value={serviceFilter}
              onChange={(event) => {
                setServiceFilter(event.target.value)
                setMeterPage(1)
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos los servicios</option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">{filteredMeters.length} resultado{filteredMeters.length === 1 ? '' : 's'}</p>
          </div>

          {meterPagination}

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Medidor</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMeters.map((meter) => {
                  const selected = String(form.idMedidor) === String(meter.idMedidor)

                  return (
                    <tr key={meter.idMedidor} className={`border-t border-gray-100 hover:bg-gray-50/70 ${selected ? 'bg-blue-50/60' : ''}`}>
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
                          onClick={() => selectMeter(meter)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                            selected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {selected ? 'Seleccionado' : 'Seleccionar'}
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
              const selected = String(form.idMedidor) === String(meter.idMedidor)
              return (
                <button
                  key={meter.idMedidor}
                  type="button"
                  onClick={() => selectMeter(meter)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                      <p className="text-sm text-gray-600">{meter.socioNombre || 'Socio sin nombre'}</p>
                      <p className="mt-1 text-xs text-gray-500">Doc. {meter.socioUsuario || 'Sin documento'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selected ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      {selected ? 'Actual' : meter.Estado}
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
            <div className="px-4 py-12 text-center text-gray-500">No hay medidores activos para mostrar.</div>
          ) : null}

          {meterPagination}
        </section>

        <aside className="space-y-4">
          {selectedMeter ? (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-100 p-3 text-cyan-700">
                    {React.createElement(serviceIcon(selectedMeter.servicioNombre), { className: 'h-6 w-6' })}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedMeter.servicioNombre}</h2>
                    <p className="text-sm text-gray-600">{selectedMeter.socioNombre}</p>
                    <p className="text-xs text-gray-500">
                      Medidor {selectedMeter.NumeroMedidor} - Doc. {selectedMeter.socioUsuario || 'Sin doc'} - {selectedMeter.TipoMedidor}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedMeter.Estado}
                </span>
              </div>
            </div>
          ) : null}

          {!adminMode ? (
            <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <Gauge className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Nueva lectura</h2>
                  <p className="text-sm text-gray-500">La lectura no puede ser menor que la ultima registrada.</p>
                </div>
              </div>

              <div className="space-y-4">
                <select
                  value={form.idMedidor}
                  onChange={(event) => setForm((prev) => ({ ...prev, idMedidor: event.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Seleccionar medidor...</option>
                  {meters.map((meter) => (
                    <option key={meter.idMedidor} value={meter.idMedidor}>
                      {meter.NumeroMedidor} - {meter.socioNombre} - {meter.servicioNombre}
                    </option>
                  ))}
                </select>

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={form.idTipoLectura}
                  onChange={(event) => setForm((prev) => ({ ...prev, idTipoLectura: event.target.value }))}
                  className="input-field"
                  disabled={!measurementTypes.length}
                >
                  {measurementTypes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.FechaLectura}
                  onChange={(event) => setForm((prev) => ({ ...prev, FechaLectura: event.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <input
                type="number"
                min="0"
                value={form.LecturaActual}
                onChange={(event) => setForm((prev) => ({ ...prev, LecturaActual: event.target.value }))}
                className="input-field"
                placeholder="Lectura actual"
                required
              />

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar medicion'}
              </button>

              {!measurementTypes.length ? (
                <p className="text-sm text-amber-700">
                  No hay tipos de lectura cargados en la base de datos. Debes crearlos para poder registrar mediciones.
                </p>
              ) : null}
              {loadingEmpleado && !adminMode ? <p className="text-sm text-gray-500">Identificando empleado actual...</p> : null}
              {adminMode && rol === 'Administrador' ? (
                <p className="text-sm text-gray-500">La lectura quedara registrada a nombre del empleado seleccionado.</p>
              ) : null}
              </div>
            </form>
          ) : null}
        </aside>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historial del medidor</h2>
              <p className="text-sm text-gray-500">{selectedMeter ? selectedMeter.NumeroMedidor : 'Sin medidor seleccionado'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportHistory('PDF')}
              disabled={Boolean(exporting)}
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => exportHistory('Excel')}
              disabled={Boolean(exporting)}
              className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => exportHistory('PSV')}
              disabled={Boolean(exporting)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Table className="mr-1.5 h-4 w-4" />
              PSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Anterior</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Consumo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Empleado</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((measurement) => (
                <tr key={measurement.idMedicion} className="border-t border-gray-100 hover:bg-gray-50/70">
                  <td className="px-4 py-3">{formatDate(measurement.FechaLectura, 'es-AR')}</td>
                  <td className="px-4 py-3">{measurement.LecturaAnterior}</td>
                  <td className="px-4 py-3">{measurement.LecturaActual}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{measurement.Consumo}</td>
                  <td className="px-4 py-3">{measurement.TipoLectura}</td>
                  <td className="px-4 py-3">{measurement.EmpleadoUsuario || 'No informado'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredHistory.length ? <div className="py-10 text-center text-gray-500">Todavia no hay lecturas para este medidor.</div> : null}

        {filteredHistory.length ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
              disabled={historyPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500">
              Pagina {historyPage} de {totalHistoryPages}
            </span>
            <button
              type="button"
              onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
              disabled={historyPage === totalHistoryPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pagina siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
