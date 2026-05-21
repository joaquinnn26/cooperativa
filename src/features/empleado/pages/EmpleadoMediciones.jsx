import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Droplet, History, Save, Search, Zap } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useCurrentEmpleado } from '@/hooks/useCurrentEmpleado.js'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { cargoMatches } from '@/utils/auth.js'
import { formatDate } from '@/utils/formatDate.js'

const initialForm = {
  idMedidor: '',
  idTipoLectura: '1',
  FechaLectura: '',
  LecturaActual: ''
}

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

export default function EmpleadoMediciones({ adminMode = false }) {
  const HISTORY_PAGE_SIZE = 6
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
  const [meters, setMeters] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(initialForm)
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [measurementTypes, setMeasurementTypes] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
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
          FechaLectura: new Date().toISOString().slice(0, 10)
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

  const filteredMeters = useMemo(() => {
    const query = search.toLowerCase()
    return meters.filter((meter) =>
      [meter.NumeroMedidor, meter.socioNombre, meter.socioUsuario, meter.servicioNombre]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [meters, search])

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
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cargar mediciones</h1>
        <p className="mt-2 text-gray-600">
          Busca por socio, documento, servicio o medidor y registra la lectura sobre el medidor correcto.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar socio, documento, servicio o medidor..."
              className="w-full text-sm outline-none"
            />
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto">
            {filteredMeters.map((meter) => (
              <button
                key={meter.idMedidor}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    idMedidor: String(meter.idMedidor),
                    FechaLectura: prev.FechaLectura || new Date().toISOString().slice(0, 10)
                  }))
                }
                className={`w-full rounded-xl border p-4 text-left transition ${
                  String(form.idMedidor) === String(meter.idMedidor)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                <p className="text-sm text-gray-600">{meter.socioNombre}</p>
                <p className="text-xs text-gray-500">
                  {meter.servicioNombre} • Doc. {meter.socioUsuario || 'Sin doc'} • {meter.TipoMedidor}
                </p>
              </button>
            ))}
            {!filteredMeters.length ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No hay medidores activos para mostrar.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          {selectedMeter ? (
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
                    {React.createElement(serviceIcon(selectedMeter.servicioNombre), { className: 'h-6 w-6' })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedMeter.servicioNombre}</h2>
                    <p className="text-sm text-gray-600">{selectedMeter.socioNombre}</p>
                    <p className="text-xs text-gray-500">
                      Medidor {selectedMeter.NumeroMedidor} • Doc. {selectedMeter.socioUsuario || 'Sin doc'} • {selectedMeter.TipoMedidor}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedMeter.Estado}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">Ultima lectura</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {latestMeasurement ? latestMeasurement.LecturaActual : 'Sin registros'}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">Ultimo consumo</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {latestMeasurement ? latestMeasurement.Consumo : 'Sin registros'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Nueva lectura</h2>

            {adminMode ? (
              <>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Seleccionar lecturista...</option>
                  {employees.map((employee) => (
                    <option key={employee.idEmpleado} value={employee.idEmpleado}>
                      {employee.Persona?.Apellido}, {employee.Persona?.Nombre} - {employee.Cargo?.Nombre}
                    </option>
                  ))}
                </select>
                {!employees.length ? (
                  <p className="text-sm text-amber-700">
                    No hay empleados activos con cargo Lecturista para asignar la lectura.
                  </p>
                ) : null}
              </>
            ) : null}

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

            <button type="submit" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              Guardar medicion
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
          </form>

          <div className="card overflow-x-auto">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Historial del medidor</h2>
            </div>

            <table className="min-w-full text-sm text-left">
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
                  <tr key={measurement.idMedicion} className="border-t border-gray-100">
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

            {!filteredHistory.length ? <div className="py-10 text-center text-gray-500">Todavia no hay lecturas para este medidor.</div> : null}

            {filteredHistory.length ? (
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                  disabled={historyPage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Pagina {historyPage} de {totalHistoryPages}
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                  disabled={historyPage === totalHistoryPages}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
