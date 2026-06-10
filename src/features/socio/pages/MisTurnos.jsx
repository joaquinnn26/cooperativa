import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  Send,
  SlidersHorizontal,
  X
} from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { useTurnos } from '@/hooks/useTurnos.jsx'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import { confirmAction } from '@/utils/alerts.js'
import {
  DEFAULT_AVAILABILITY_DAYS,
  TURNOS_REASON_MAX_LENGTH,
  TURNOS_REASON_MIN_LENGTH,
  compareTurnos,
  formatDateLabel,
  formatDateLong,
  normalizeText,
  normalizeTurno,
  sanitizePlainText,
  validateTurnoRequest,
  statusStyles
} from '@/utils/turnosUtils.jsx'

const PAGE_SIZE = 5

const MOTIVE_TYPES = [
  'Consulta administrativa',
  'Facturacion o pagos',
  'Reclamo presencial',
  'Entrega de documentacion',
  'Otro motivo'
]

const STATUS_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'propuestos', label: 'Propuestos' },
  { key: 'confirmados', label: 'Confirmados' },
  { key: 'cerrados', label: 'Cerrados' }
]

function canAcceptProposal(turno) {
  return normalizeText(turno.estado).startsWith('propuest') && turno.fechaPropuesta && turno.horaPropuesta
}

function matchesStatusFilter(turno, filter) {
  const status = normalizeText(turno.estado)

  if (filter === 'pendientes') return status === 'pendiente'
  if (filter === 'propuestos') return status.startsWith('propuest')
  if (filter === 'confirmados') return ['aprobado', 'aprobada', 'aceptado', 'aceptada'].includes(status)
  if (filter === 'cerrados') return ['rechazado', 'rechazada', 'cancelado', 'cancelada'].includes(status)

  return true
}

export default function MisTurnos() {
  const { socioId, loadingSocio, resolveSocioId } = useCurrentSocio()
  const {
    aceptarPropuestaBackend,
    crearTurno,
    obtenerDisponibilidadTurnos,
    obtenerTurnosPorSocio
  } = useTurnos()
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const addNotification = useAppStore((state) => state.addNotification)
  const [searchParams, setSearchParams] = useSearchParams()
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTurno, setSelectedTurno] = useState(null)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [availability, setAvailability] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [motivoTipo, setMotivoTipo] = useState(MOTIVE_TYPES[0])
  const [motivoDetalle, setMotivoDetalle] = useState('')
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const loadTurnos = async () => {
    setLoading(true)

    try {
      const resolvedSocioId = socioId ?? (await resolveSocioId())
      if (!resolvedSocioId) throw new Error('No se pudo identificar el socio actual.')

      const datos = await obtenerTurnosPorSocio(resolvedSocioId)
      setTurnos((datos || []).map(normalizeTurno).sort(compareTurnos))
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar tus turnos.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTurnos()
  }, [socioId])

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setRequestModalOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!requestModalOpen) return

    let cancelled = false

    async function loadAvailability() {
      setLoadingAvailability(true)

      try {
        const data = await obtenerDisponibilidadTurnos({
          dias: DEFAULT_AVAILABILITY_DAYS,
          turnosBase: turnos
        })
        if (cancelled) return

        setAvailability(data)
        const firstAvailableDay = data.find((day) => day.horarios.length)
        setSelectedDate(firstAvailableDay?.fecha || '')
        setSelectedTime(firstAvailableDay?.horarios[0] || '')
      } catch (error) {
        if (cancelled) return
        console.error('Error al cargar disponibilidad de turnos', error)
        addNotification({
          title: 'Error',
          message: error.message || 'No se pudo cargar la disponibilidad de turnos.',
          type: 'error'
        })
      } finally {
        if (!cancelled) setLoadingAvailability(false)
      }
    }

    loadAvailability()

    return () => {
      cancelled = true
    }
  }, [addNotification, obtenerDisponibilidadTurnos, requestModalOpen, turnos])

  const summary = useMemo(
    () => ({
      total: turnos.length,
      pending: turnos.filter((turno) => ['pendiente', 'propuesto'].includes(normalizeText(turno.estado))).length,
      confirmed: turnos.filter((turno) =>
        ['aprobado', 'aprobada', 'aceptado', 'aceptada'].includes(normalizeText(turno.estado))
      ).length
    }),
    [turnos]
  )

  const filteredTurnos = useMemo(() => {
    const query = search.trim().toLowerCase()

    return turnos.filter((turno) => {
      const haystack = [
        turno.fecha,
        turno.hora,
        turno.fechaPropuesta,
        turno.horaPropuesta,
        turno.motivo,
        turno.estado,
        turno.observacionAdmin
      ]
        .join(' ')
        .toLowerCase()

      return matchesStatusFilter(turno, statusFilter) && (!query || haystack.includes(query))
    })
  }, [search, statusFilter, turnos])

  const selectedDay = useMemo(
    () => availability.find((day) => day.fecha === selectedDate),
    [availability, selectedDate]
  )
  const motivoDetalleLimpio = useMemo(() => sanitizePlainText(motivoDetalle), [motivoDetalle])
  const validationError = useMemo(
    () =>
      validateTurnoRequest({
        fecha: selectedDate,
        hora: selectedTime,
        motivoDetalle
      }),
    [motivoDetalle, selectedDate, selectedTime]
  )
  const motivoFinal = `${motivoTipo}: ${motivoDetalleLimpio}`
  const canSubmitRequest = !validationError

  const totalPages = Math.max(1, Math.ceil(filteredTurnos.length / PAGE_SIZE))
  const paginatedTurnos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredTurnos.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredTurnos])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const openRequestModal = () => {
    setRequestModalOpen(true)
    setSearchParams({ nuevo: '1' })
  }

  const closeRequestModal = () => {
    setRequestModalOpen(false)
    setMotivoTipo(MOTIVE_TYPES[0])
    setMotivoDetalle('')
    setAvailability([])
    setSelectedDate('')
    setSelectedTime('')
    setSearchParams({})
  }

  const handleDateSelect = (day) => {
    if (!day.horarios.length) return
    setSelectedDate(day.fecha)
    setSelectedTime(day.horarios[0])
  }

  const handleCreateTurno = async (event) => {
    event.preventDefault()

    if (validationError) {
      addNotification({
        title: 'Faltan datos',
        message: validationError,
        type: 'error'
      })
      return
    }

    setIsCreating(true)

    try {
      const resolvedSocioId = socioId ?? (await resolveSocioId())

      if (!resolvedSocioId) {
        throw new Error('No se pudo identificar el socio logueado.')
      }

      await crearTurno({
        idSocio: Number(resolvedSocioId),
        IdSocio: Number(resolvedSocioId),
        socioNombre: nombre || usuario || `Socio ${resolvedSocioId}`,
        SocioNombre: nombre || usuario || `Socio ${resolvedSocioId}`,
        socioDocumento: usuario || '',
        SocioDocumento: usuario || '',
        fecha: selectedDate,
        Fecha: selectedDate,
        hora: selectedTime,
        Hora: selectedTime,
        motivo: motivoFinal,
        Motivo: motivoFinal,
        estadoTurnoId: 1,
        idEstadoTurno: 1,
        IdEstadoTurno: 1
      })

      addNotification({
        title: 'Turno solicitado',
        message: 'Tu turno quedo pendiente de aprobacion.',
        type: 'success'
      })

      closeRequestModal()
      await loadTurnos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo registrar el turno.',
        type: 'error'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAcceptProposal = async (turno) => {
    const confirmed = await confirmAction({
      title: 'Aceptar horario propuesto',
      message: `Vas a confirmar el turno para ${formatDateLong(turno.fechaPropuesta)} a las ${turno.horaPropuesta} hs.`,
      confirmButtonText: 'Aceptar horario',
      type: 'question'
    })

    if (!confirmed) return

    setUpdatingId(turno.id)

    try {
      await aceptarPropuestaBackend(turno.id)
      addNotification({
        title: 'Horario aceptado',
        message: 'El turno quedo confirmado con la propuesta del administrador.',
        type: 'success'
      })
      await loadTurnos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aceptar la propuesta.',
        type: 'error'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading || loadingSocio) {
    return <div className="mt-10 text-center text-gray-500">Cargando turnos...</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis turnos presenciales</h1>
          <p className="mt-2 text-gray-600">Consulta tus solicitudes y responde propuestas de horario.</p>
        </div>
        <button
          type="button"
          onClick={openRequestModal}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo turno
        </button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Confirmados</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.confirmed}</p>
        </div>
      </div>

      <div className="card mb-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 lg:max-w-md">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por fecha, motivo o estado..."
              className="w-full min-w-0 text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center text-sm font-medium text-gray-500">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Estado
            </span>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Mostrando {filteredTurnos.length} de {turnos.length} turnos.
        </p>
      </div>

      <div className="space-y-4">
        {paginatedTurnos.map((turno) => (
          <div key={turno.id} className="card">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold capitalize text-gray-900">
                      {formatDateLong(turno.fecha)} - {turno.hora} hs
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">{turno.motivo}</p>
                  </div>
                </div>

                {turno.fechaPropuesta && turno.horaPropuesta ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-xs uppercase text-blue-700">Propuesta del administrador</p>
                    <p className="mt-1 font-semibold capitalize text-gray-900">
                      {formatDateLong(turno.fechaPropuesta)} - {turno.horaPropuesta} hs
                    </p>
                    {turno.observacionAdmin ? (
                      <p className="mt-2 text-sm text-gray-600">{turno.observacionAdmin}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 lg:min-w-52 lg:items-end">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(turno.estado)}`}>
                  {turno.estado}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedTurno(turno)}
                  className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </button>

                {canAcceptProposal(turno) ? (
                  <button
                    type="button"
                    onClick={() => handleAcceptProposal(turno)}
                    disabled={updatingId === turno.id}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {updatingId === turno.id ? 'Aceptando...' : 'Aceptar horario'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {!filteredTurnos.length ? (
          <div className="card py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">
              {turnos.length ? 'No hay turnos con esos filtros.' : 'No tenes turnos registrados.'}
            </p>
            <p className="mt-2 text-gray-500">
              {turnos.length ? 'Proba cambiando el estado o la busqueda.' : 'Cuando solicites uno, vas a verlo aca con su estado.'}
            </p>
            <button
              type="button"
              onClick={openRequestModal}
              className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Solicitar turno
            </button>
          </div>
        ) : null}

        {filteredTurnos.length > PAGE_SIZE ? (
          <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Pagina {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {requestModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Solicitar visita presencial</h2>
                  <p className="mt-1 text-sm text-gray-600">Reserva un turno con atencion administrativa en la cooperativa.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRequestModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar solicitud de turno"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTurno} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <section className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Dias disponibles</h3>
                  </div>

                  {loadingAvailability ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando disponibilidad...
                    </div>
                  ) : availability.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availability.map((day) => {
                        const active = selectedDate === day.fecha

                        return (
                          <button
                            key={day.fecha}
                            type="button"
                            onClick={() => handleDateSelect(day)}
                            disabled={!day.horarios.length || isCreating}
                            className={`rounded-lg border px-4 py-3 text-left transition ${
                              active
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : day.horarios.length
                                  ? 'border-gray-200 bg-white text-gray-800 hover:border-blue-200 hover:bg-gray-50'
                                  : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                          >
                            <span className="block text-sm font-semibold capitalize">{formatDateLabel(day.fecha)}</span>
                            <span className="mt-1 block text-xs">
                              {day.horarios.length ? `${day.horarios.length} horarios` : 'Sin horarios'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-500">
                      No hay turnos disponibles desde la fecha actual.
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Horarios</h3>
                  </div>

                  {selectedDay?.horarios?.length ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                      {selectedDay.horarios.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          disabled={isCreating}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            selectedTime === slot
                              ? 'border-blue-500 bg-blue-600 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Selecciona un dia con horarios disponibles.
                    </div>
                  )}
                </section>

                <section className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Razon</label>
                    <select
                      value={motivoTipo}
                      onChange={(event) => setMotivoTipo(event.target.value)}
                      className="input-field"
                      disabled={isCreating}
                    >
                      {MOTIVE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Detalle</label>
                    <textarea
                      value={motivoDetalle}
                      onChange={(event) => setMotivoDetalle(event.target.value)}
                      placeholder="Ej: consulta por factura, alta de tramite, documentacion pendiente..."
                      rows={4}
                      minLength={TURNOS_REASON_MIN_LENGTH}
                      maxLength={TURNOS_REASON_MAX_LENGTH}
                      required
                      className="input-field"
                      disabled={isCreating}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {motivoDetalleLimpio.length}/{TURNOS_REASON_MAX_LENGTH} caracteres. Minimo {TURNOS_REASON_MIN_LENGTH}.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="h-fit space-y-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div>
                  <p className="text-sm text-gray-500">Turno seleccionado</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900">
                    {selectedDate ? formatDateLong(selectedDate) : 'Sin dia seleccionado'}
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-blue-700">
                    {selectedTime ? `${selectedTime} hs` : 'Sin horario'}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-500">Estado inicial</p>
                  <p className="mt-1 font-semibold text-gray-900">Pendiente de aprobacion</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-500">Razon</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {motivoDetalleLimpio ? motivoFinal : 'Todavia no completaste el detalle.'}
                  </p>
                </div>

                {loadingSocio ? <p className="text-sm text-gray-500">Identificando socio actual...</p> : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:flex-col">
                  <button
                    type="button"
                    onClick={closeRequestModal}
                    className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    disabled={isCreating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || loadingSocio || loadingAvailability || !canSubmitRequest}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {isCreating ? 'Enviando...' : 'Solicitar turno'}
                  </button>
                </div>
              </aside>
            </form>
          </div>
        </div>
      ) : null}

      {selectedTurno ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Detalle del turno</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{selectedTurno.motivo || 'Turno presencial'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTurno(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Solicitado</p>
                <p className="mt-1 font-semibold capitalize text-gray-900">
                  {formatDateLong(selectedTurno.fecha)} - {selectedTurno.hora} hs
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Estado</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(selectedTurno.estado)}`}>
                  {selectedTurno.estado}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase text-gray-500">Motivo</p>
                <p className="mt-1 text-sm text-gray-700">{selectedTurno.motivo || 'Sin motivo informado'}</p>
              </div>
              {selectedTurno.fechaPropuesta && selectedTurno.horaPropuesta ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase text-blue-700">Propuesta del administrador</p>
                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {formatDateLong(selectedTurno.fechaPropuesta)} - {selectedTurno.horaPropuesta} hs
                  </p>
                  {selectedTurno.observacionAdmin ? (
                    <p className="mt-2 text-sm text-gray-600">{selectedTurno.observacionAdmin}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTurno(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
