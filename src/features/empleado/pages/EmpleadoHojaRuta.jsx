import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Eraser,
  FileSignature,
  Loader2,
  MapPinned,
  Play,
  Save,
  Search,
  Signature,
  XCircle
} from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useCurrentEmpleado } from '@/hooks/useCurrentEmpleado.js'
import { cargoMatches } from '@/utils/auth.js'
import { formatDate } from '@/utils/formatDate.js'
import { isNonNegativeNumber, isPositiveNumber } from '@/utils/validation.js'

function statusStyles(status) {
  if (status === 'Finalizada' || status === 'Medido') return 'bg-emerald-100 text-emerald-700'
  if (status === 'En curso') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-700'
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function routeProgress(route) {
  const total = route?.items?.length || 0
  const done = route?.items?.filter((item) => item.estado === 'Medido').length || 0
  const pending = route?.items?.filter((item) => item.estado === 'Pendiente').length || 0
  const resolved = Math.max(total - pending, 0)
  return { total, done, pending, resolved, readyToClose: total > 0 && pending === 0 }
}

function SignaturePad({ value, onChange, disabled = false }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const emptyRef = useRef(true)

  const prepareCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2.5
    context.strokeStyle = '#111827'

    if (value) {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height)
      image.src = value
      emptyRef.current = false
    } else {
      context.clearRect(0, 0, rect.width, rect.height)
      emptyRef.current = true
    }
  }

  useEffect(() => {
    prepareCanvas()
  }, [value])

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const startDrawing = (event) => {
    if (disabled) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const point = pointFromEvent(event)

    drawingRef.current = true
    context.beginPath()
    context.moveTo(point.x, point.y)
    canvas.setPointerCapture?.(event.pointerId)
  }

  const draw = (event) => {
    if (disabled || !drawingRef.current) return
    const context = canvasRef.current.getContext('2d')
    const point = pointFromEvent(event)

    context.lineTo(point.x, point.y)
    context.stroke()
    emptyRef.current = false
  }

  const stopDrawing = () => {
    if (disabled || !drawingRef.current) return
    drawingRef.current = false
    onChange(emptyRef.current ? '' : canvasRef.current.toDataURL('image/png'))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    context.clearRect(0, 0, rect.width, rect.height)
    emptyRef.current = true
    onChange('')
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-white p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className={`h-44 w-full rounded-md bg-white ${disabled ? 'cursor-not-allowed opacity-75' : 'touch-none cursor-crosshair'}`}
        />
      </div>
      <button
        type="button"
        onClick={clearSignature}
        disabled={disabled || !value}
        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Eraser className="mr-2 h-4 w-4" />
        Limpiar firma
      </button>
    </div>
  )
}

export default function EmpleadoHojaRuta() {
  const addNotification = useAppStore((state) => state.addNotification)
  const idEmpleado = useAuthStore((state) => state.idEmpleado)
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const cargo = useAuthStore((state) => state.cargo)
  const { empleadoId, loadingEmpleado, resolveEmpleadoId } = useCurrentEmpleado()

  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchMeasurementTypes = useServiceWorkflowStore((state) => state.fetchMeasurementTypes)
  const fetchMeasurementRoutesByEmployee = useServiceWorkflowStore((state) => state.fetchMeasurementRoutesByEmployee)
  const startMeasurementRoute = useServiceWorkflowStore((state) => state.startMeasurementRoute)
  const saveMeasurementRouteReading = useServiceWorkflowStore((state) => state.saveMeasurementRouteReading)
  const updateMeasurementRouteItem = useServiceWorkflowStore((state) => state.updateMeasurementRouteItem)
  const completeMeasurementRoute = useServiceWorkflowStore((state) => state.completeMeasurementRoute)

  const [routes, setRoutes] = useState([])
  const [meters, setMeters] = useState([])
  const [measurementTypes, setMeasurementTypes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [readings, setReadings] = useState({})
  const [search, setSearch] = useState('')
  const [signatureDataUrl, setSignatureDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingMeterId, setSavingMeterId] = useState(null)
  const [closing, setClosing] = useState(false)

  const canAccess = cargoMatches(cargo, 'Lecturista')

  const loadData = async () => {
    setLoading(true)

    try {
      const resolvedEmpleadoId = empleadoId ?? idEmpleado ?? (await resolveEmpleadoId())

      const [metersData, typesData, routesData] = await Promise.all([
        fetchMeters(),
        fetchMeasurementTypes(),
        resolvedEmpleadoId ? fetchMeasurementRoutesByEmployee(resolvedEmpleadoId) : []
      ])

      setMeters(metersData || [])
      setMeasurementTypes(typesData || [])
      setRoutes(routesData || [])

      if (!selectedRouteId && routesData?.[0]?.idRutaMedicion != null) {
        setSelectedRouteId(String(routesData[0].idRutaMedicion))
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo cargar la hoja de ruta.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canAccess) return
    loadData()
  }, [canAccess, empleadoId, idEmpleado])

  const selectedRoute = useMemo(
    () => routes.find((route) => String(route.idRutaMedicion) === String(selectedRouteId)) || null,
    [routes, selectedRouteId]
  )

  const routeMeters = useMemo(() => {
    if (!selectedRoute) return []
    const query = search.trim().toLowerCase()

    return selectedRoute.items
      .map((item) => ({
        ...item,
        meter: meters.find((meter) => String(meter.idMedidor) === String(item.idMedidor)) || null
      }))
      .filter((item) => {
        if (!query) return true
        return [
          item.meter?.NumeroMedidor,
          item.meter?.socioNombre,
          item.meter?.socioUsuario,
          item.meter?.servicioNombre
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
  }, [meters, search, selectedRoute])

  const progress = routeProgress(selectedRoute)
  const defaultMeasurementTypeId = measurementTypes[0]?.idTipoLectura || 1

  const refreshRoutes = async () => {
    const resolvedEmpleadoId = empleadoId ?? idEmpleado ?? (await resolveEmpleadoId())
    const updatedRoutes = resolvedEmpleadoId ? await fetchMeasurementRoutesByEmployee(resolvedEmpleadoId) : []
    setRoutes(updatedRoutes || [])
    return updatedRoutes || []
  }

  const handleStartRoute = async () => {
    if (!selectedRoute) return

    try {
      await startMeasurementRoute(selectedRoute.idRutaMedicion)
      await refreshRoutes()
      addNotification({
        title: 'Hoja iniciada',
        message: 'Ya podes cargar las mediciones del recorrido.',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo iniciar la hoja de ruta.',
        type: 'error'
      })
    }
  }

  const handleSaveReading = async (item) => {
    const readingValue = readings[item.idMedidor]
    const numericReading = Number(readingValue)

    if (!selectedRoute || !item.meter) return

    if (!isPositiveNumber(item.idMedidor) || !isNonNegativeNumber(readingValue)) {
      addNotification({
        title: 'Lectura invalida',
        message: 'Ingresa un valor numerico mayor o igual a cero.',
        type: 'error'
      })
      return
    }

    setSavingMeterId(item.idMedidor)

    try {
      const resolvedEmpleadoId = empleadoId ?? idEmpleado ?? (await resolveEmpleadoId())
      if (!resolvedEmpleadoId) throw new Error('No se pudo identificar el lecturista.')

      await saveMeasurementRouteReading(selectedRoute.idRutaMedicion, item.idMedidor, {
        idEmpleado: Number(resolvedEmpleadoId),
        idTipoLectura: Number(defaultMeasurementTypeId),
        fechaLectura: todayInput(),
        lecturaActual: numericReading,
        tipoLecturaNombre: measurementTypes[0]?.Nombre || measurementTypes[0]?.label || 'Lectura normal',
        empleadoUsuario: usuario,
        empleadoNombre: nombre || usuario
      })

      setReadings((current) => ({ ...current, [item.idMedidor]: '' }))
      await refreshRoutes()

      addNotification({
        title: 'Medicion cargada',
        message: `Se guardo la lectura del medidor ${item.meter.NumeroMedidor}.`,
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo guardar la medicion.',
        type: 'error'
      })
    } finally {
      setSavingMeterId(null)
    }
  }

  const handleMarkIssue = async (item, estado, observacion) => {
    if (!selectedRoute || !item.meter) return

    if (selectedRoute.estado === 'Pendiente') {
      addNotification({
        title: 'Hoja no iniciada',
        message: 'Primero inicia la hoja de ruta.',
        type: 'error'
      })
      return
    }

    setSavingMeterId(item.idMedidor)

    try {
      await updateMeasurementRouteItem(selectedRoute.idRutaMedicion, item.idMedidor, {
        estado,
        observacion
      })

      await refreshRoutes()
      addNotification({
        title: 'Incidencia registrada',
        message: `El medidor ${item.meter.NumeroMedidor} quedo marcado como ${observacion}.`,
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo registrar la incidencia.',
        type: 'error'
      })
    } finally {
      setSavingMeterId(null)
    }
  }

  const handleCloseRoute = async () => {
    if (!selectedRoute) return

    setClosing(true)
    try {
      await completeMeasurementRoute(selectedRoute.idRutaMedicion, {
        firmaDigital: signatureDataUrl
      })

      await refreshRoutes()
      addNotification({
        title: 'Hoja finalizada',
        message: 'La ruta quedo cerrada con firma digital.',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo finalizar la hoja de ruta.',
        type: 'error'
      })
    } finally {
      setClosing(false)
    }
  }

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Esta vista solo esta disponible para empleados con cargo Lecturista. Tu cargo actual es: {cargo || 'No informado'}.
        </div>
      </div>
    )
  }

  if (loading || loadingEmpleado) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-gray-500">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
        Cargando hoja de ruta...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-600">Trabajo en campo</p>
          <h1 className="text-3xl font-bold text-gray-900">Mi hoja de ruta</h1>
          <p className="mt-2 text-gray-600">Inicia el recorrido, carga cada medicion y firma al finalizar.</p>
        </div>
        {selectedRoute ? (
          <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusStyles(selectedRoute.estado)}`}>
            {selectedRoute.estado}
          </span>
        ) : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Hojas asignadas</h2>
            </div>

            <div className="space-y-3">
              {routes.map((route) => {
                const itemProgress = routeProgress(route)
                const active = String(route.idRutaMedicion) === String(selectedRouteId)

                return (
                  <button
                    key={route.idRutaMedicion}
                    type="button"
                    onClick={() => {
                      setSelectedRouteId(String(route.idRutaMedicion))
                      setSignatureDataUrl(route.firmaDigital || '')
                    }}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{route.nombre}</p>
                        <p className="text-sm text-gray-500">{formatDate(route.fecha, 'es-AR')}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(route.estado)}`}>
                        {route.estado}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {itemProgress.done}/{itemProgress.total} medidores
                    </p>
                  </button>
                )
              })}

              {!routes.length ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No tenes hojas de ruta asignadas.
                </div>
              ) : null}
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          {selectedRoute ? (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRoute.nombre}</h2>
                    <p className="mt-1 text-sm text-gray-500">{formatDate(selectedRoute.fecha, 'es-AR')}</p>
                    <p className="mt-3 text-gray-600">
                      Progreso: {progress.resolved} de {progress.total} puntos resueltos. Mediciones cargadas: {progress.done}.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedRoute.estado === 'Pendiente' ? (
                      <button
                        type="button"
                        onClick={handleStartRoute}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar hoja de ruta
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar socio, documento o medidor..."
                    className="w-full min-w-0 text-sm outline-none"
                  />
                </div>
              </section>

              <section className="space-y-3">
                {routeMeters.map((item) => {
                  const measured = item.estado === 'Medido'
                  const disabled = selectedRoute.estado === 'Pendiente' || selectedRoute.estado === 'Finalizada'

                  return (
                    <article key={`${selectedRoute.idRutaMedicion}-${item.idMedidor}`} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                        <div>
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700">
                              {item.orden}
                            </span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.meter?.socioNombre || 'Socio sin nombre'}
                              </h3>
                              <p className="text-sm text-gray-500">Doc. {item.meter?.socioUsuario || 'Sin documento'}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-semibold uppercase text-gray-500">Medidor</p>
                              <p className="mt-1 font-semibold text-gray-900">{item.meter?.NumeroMedidor || item.idMedidor}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-semibold uppercase text-gray-500">Servicio</p>
                              <p className="mt-1 font-semibold text-gray-900">{item.meter?.servicioNombre || 'Servicio'}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-semibold uppercase text-gray-500">Estado</p>
                              <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(item.estado)}`}>
                                {item.estado}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          {measured ? (
                            <div>
                              <div className="mb-3 flex items-center gap-2 text-emerald-700">
                                <CheckCircle2 className="h-5 w-5" />
                                <p className="font-semibold">Medicion cargada</p>
                              </div>
                              <p className="text-sm text-gray-600">Lectura actual</p>
                              <p className="mt-1 text-2xl font-bold text-gray-900">{item.lecturaActual}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700">Lectura actual</label>
                              <input
                                type="number"
                                min="0"
                                value={readings[item.idMedidor] || ''}
                                onChange={(event) =>
                                  setReadings((current) => ({
                                    ...current,
                                    [item.idMedidor]: event.target.value
                                  }))
                                }
                                disabled={disabled || savingMeterId === item.idMedidor}
                                className="input-field"
                                placeholder="Valor"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveReading(item)}
                                disabled={disabled || savingMeterId === item.idMedidor || !readings[item.idMedidor]}
                                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                {savingMeterId === item.idMedidor ? 'Guardando...' : 'Guardar medicion'}
                              </button>
                              <div className="grid gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleMarkIssue(item, 'NoAcceso', 'No acceso')}
                                  disabled={disabled || savingMeterId === item.idMedidor}
                                  className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  No acceso
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkIssue(item, 'MedidorDanado', 'Medidor danado')}
                                  disabled={disabled || savingMeterId === item.idMedidor}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Medidor dañado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkIssue(item, 'Observado', 'Observado')}
                                  disabled={disabled || savingMeterId === item.idMedidor}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Observado
                                </button>
                              </div>
                              {selectedRoute.estado === 'Pendiente' ? (
                                <p className="text-xs text-amber-700">Primero inicia la hoja de ruta.</p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}

                {!routeMeters.length ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                    No hay medidores que coincidan con la busqueda.
                  </div>
                ) : null}
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                  <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <Signature className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Firma de cierre</h2>
                    <p className="mt-1 text-sm text-gray-500">Se habilita cuando todos los medidores de la hoja estan cargados.</p>
                  </div>
                </div>

                {selectedRoute.estado === 'Finalizada' && selectedRoute.firmaDigital ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">Firma registrada</p>
                    <img src={selectedRoute.firmaDigital} alt="Firma digital" className="h-36 w-full rounded-lg bg-white object-contain" />
                  </div>
                ) : (
                  <>
                    <SignaturePad
                      value={signatureDataUrl}
                      onChange={setSignatureDataUrl}
                      disabled={!progress.readyToClose || selectedRoute.estado === 'Finalizada'}
                    />

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className={`text-sm ${progress.readyToClose ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {progress.readyToClose
                          ? 'No quedan puntos pendientes. Ya podes firmar y cerrar.'
                          : `Faltan ${progress.pending} puntos por resolver para habilitar la firma.`}
                      </p>
                      <button
                        type="button"
                        onClick={handleCloseRoute}
                        disabled={!progress.readyToClose || !signatureDataUrl || closing}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FileSignature className="mr-2 h-5 w-5" />
                        {closing ? 'Finalizando...' : 'Finalizar hoja de ruta'}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-gray-500">
              <XCircle className="mx-auto mb-3 h-8 w-8" />
              Selecciona una hoja de ruta para comenzar.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
