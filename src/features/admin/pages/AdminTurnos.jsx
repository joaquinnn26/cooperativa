import React, { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  Send,
  X,
  XCircle
} from 'lucide-react'
import { useAdminTurnos } from '@/hooks/useAdminTurnos.jsx'
import { useTurnos } from '@/hooks/useTurnos.jsx'
import useAppStore from '@/store/appStore.js'
import { confirmAction } from '@/utils/alerts.js'
import {
  DEFAULT_AVAILABILITY_DAYS,
  TURNOS_REASON_MAX_LENGTH,
  formatDateLabel,
  formatDateLong,
  normalizeText,
  normalizeTurno,
  sanitizePlainText,
  statusStyles
} from '@/utils/turnosUtils.jsx'

const STATUS_FILTERS = ['Todos', 'Pendiente', 'Propuesto', 'Aprobado', 'Aceptado', 'Rechazado', 'Cancelado']
const PAGE_SIZE = 6

function statusKey(status) {
  const normalized = normalizeText(status)
  if (normalized === 'aprobada') return 'aprobado'
  if (normalized === 'aceptada') return 'aceptado'
  if (normalized === 'rechazada') return 'rechazado'
  if (normalized === 'cancelada') return 'cancelado'
  if (normalized === 'propuesta') return 'propuesto'
  return normalized
}

function isPending(status) {
  return statusKey(status) === 'pendiente'
}

function isOpenStatus(status) {
  return ['pendiente', 'propuesto'].includes(statusKey(status))
}

export default function AdminTurnos() {
  const addNotification = useAppStore((state) => state.addNotification)
  const { obtenerDisponibilidadTurnos } = useTurnos()
  const { actualizarEstadoTurno, obtenerTodosLosTurnos } = useAdminTurnos()
  const [turnos, setTurnos] = useState([])
  const [availability, setAvailability] = useState([])
  const [cargando, setCargando] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [proposingId, setProposingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [proposalForm, setProposalForm] = useState({
    fechaPropuesta: '',
    horaPropuesta: '',
    observacionAdmin: ''
  })
  const [rejectReason, setRejectReason] = useState('')

  const loadData = async () => {
    setCargando(true)

    try {
      const datos = await obtenerTodosLosTurnos()
      const normalized = (datos || []).map(normalizeTurno)
      const disponibilidad = await obtenerDisponibilidadTurnos({
        dias: DEFAULT_AVAILABILITY_DAYS,
        turnosBase: normalized
      })

      setTurnos(normalized)
      setAvailability(disponibilidad)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar los turnos.',
        type: 'error'
      })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const summary = useMemo(
    () => ({
      total: turnos.length,
      pending: turnos.filter((turno) => isPending(turno.estado)).length,
      proposed: turnos.filter((turno) => statusKey(turno.estado) === 'propuesto').length,
      confirmed: turnos.filter((turno) => ['aprobado', 'aceptado'].includes(statusKey(turno.estado))).length
    }),
    [turnos]
  )

  const filteredTurnos = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filterKey = statusFilter === 'Todos' ? '' : statusKey(statusFilter)

    return turnos.filter((turno) => {
      const matchesStatus = !filterKey || statusKey(turno.estado) === filterKey
      const haystack = [
        turno.socio,
        turno.documentoSocio,
        turno.fecha,
        turno.hora,
        turno.fechaPropuesta,
        turno.horaPropuesta,
        turno.motivo,
        turno.estado
      ]
        .join(' ')
        .toLowerCase()

      return matchesStatus && (!query || haystack.includes(query))
    })
  }, [search, statusFilter, turnos])

  const totalPages = Math.max(1, Math.ceil(filteredTurnos.length / PAGE_SIZE))
  const paginatedTurnos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredTurnos.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredTurnos])

  const firstAvailableSlot = useMemo(() => {
    const day = availability.find((item) => item.horarios.length)
    if (!day) return null
    return { fecha: day.fecha, hora: day.horarios[0] }
  }, [availability])

  const proposingTurno = useMemo(
    () => turnos.find((turno) => turno.id === proposingId) || null,
    [proposingId, turnos]
  )

  const rejectingTurno = useMemo(
    () => turnos.find((turno) => turno.id === rejectingId) || null,
    [rejectingId, turnos]
  )

  const selectedProposalDay = useMemo(
    () => availability.find((day) => day.fecha === proposalForm.fechaPropuesta),
    [availability, proposalForm.fechaPropuesta]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const openProposal = (turno) => {
    setRejectingId(null)
    setRejectReason('')
    setProposingId(turno.id)
    setProposalForm({
      fechaPropuesta: firstAvailableSlot?.fecha || '',
      horaPropuesta: firstAvailableSlot?.hora || '',
      observacionAdmin: ''
    })
  }

  const openReject = (turno) => {
    setProposingId(null)
    setRejectingId(turno.id)
    setRejectReason('')
  }

  const handleApprove = async (turno) => {
    const confirmed = await confirmAction({
      title: 'Aprobar turno',
      message: `Vas a aprobar el turno de ${turno.socio || 'este socio'} para ${formatDateLong(turno.fecha)} a las ${turno.hora} hs.`,
      confirmButtonText: 'Aprobar',
      type: 'question'
    })

    if (!confirmed) return

    setUpdatingId(turno.id)

    try {
      await actualizarEstadoTurno(turno.id, 2)
      addNotification({
        title: 'Turno aprobado',
        message: `El turno de ${turno.socio || 'socio'} quedo aprobado.`,
        type: 'success'
      })
      await loadData()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aprobar el turno.',
        type: 'error'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleProposal = async (turno) => {
    const observacionLimpia = sanitizePlainText(proposalForm.observacionAdmin).slice(0, TURNOS_REASON_MAX_LENGTH)

    if (!proposalForm.fechaPropuesta || !proposalForm.horaPropuesta) {
      addNotification({
        title: 'Faltan datos',
        message: 'Selecciona un dia y horario disponible.',
        type: 'error'
      })
      return
    }

    setUpdatingId(turno.id)

    try {
      await actualizarEstadoTurno(turno.id, 3, {
        fechaPropuesta: proposalForm.fechaPropuesta,
        FechaPropuesta: proposalForm.fechaPropuesta,
        horaPropuesta: proposalForm.horaPropuesta,
        HoraPropuesta: proposalForm.horaPropuesta,
        observacionAdmin: observacionLimpia,
        ObservacionAdmin: observacionLimpia
      })

      addNotification({
        title: 'Propuesta enviada',
        message: `Se propuso otro horario para ${turno.socio || 'el socio'}.`,
        type: 'success'
      })

      setProposingId(null)
      await loadData()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo proponer otro horario.',
        type: 'error'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (turno) => {
    const motivoLimpio = sanitizePlainText(rejectReason).slice(0, TURNOS_REASON_MAX_LENGTH)

    if (motivoLimpio.length < 10) {
      addNotification({
        title: 'Faltan datos',
        message: 'Indica un motivo de rechazo de al menos 10 caracteres.',
        type: 'error'
      })
      return
    }

    const confirmed = await confirmAction({
      title: 'Rechazar turno',
      message: `Vas a rechazar el turno de ${turno.socio || 'este socio'}. El socio vera el motivo cargado.`,
      confirmButtonText: 'Rechazar',
      type: 'warning',
      danger: true
    })

    if (!confirmed) return

    setUpdatingId(turno.id)

    try {
      await actualizarEstadoTurno(turno.id, 4, {
        observacionAdmin: motivoLimpio,
        ObservacionAdmin: motivoLimpio
      })

      addNotification({
        title: 'Turno rechazado',
        message: `El turno de ${turno.socio || 'socio'} quedo rechazado.`,
        type: 'success'
      })

      setRejectingId(null)
      await loadData()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo rechazar el turno.',
        type: 'error'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (cargando) {
    return <div className="mt-10 text-center text-gray-500">Cargando turnos de la cooperativa...</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de turnos presenciales</h1>
          <p className="mt-2 text-gray-600">Revisa solicitudes de socios y administra horarios de atencion.</p>
        </div>
        <div className="rounded-full bg-blue-100 p-3 text-blue-700">
          <CalendarCheck className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Propuestos</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{summary.proposed}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Confirmados</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.confirmed}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar socio, documento, motivo..."
                  className="w-full min-w-0 text-sm outline-none md:w-80"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="input-field md:max-w-52"
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'Todos' ? 'Todos los estados' : status}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500">
              Mostrando {filteredTurnos.length} de {turnos.length} turnos.
            </p>
          </div>

          {paginatedTurnos.map((turno) => (
            <div key={turno.id} className="card">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{turno.socio || `Socio ${turno.idSocio}`}</h2>
                      <p className="text-sm text-gray-500">
                        {turno.documentoSocio ? `Doc. ${turno.documentoSocio}` : `ID socio ${turno.idSocio || '-'}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase text-gray-500">Solicitado</p>
                      <p className="mt-1 font-semibold capitalize text-gray-900">
                        {formatDateLong(turno.fecha)} - {turno.hora} hs
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase text-gray-500">Motivo</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{turno.motivo || 'Sin motivo informado'}</p>
                    </div>
                  </div>

                  {turno.fechaPropuesta && turno.horaPropuesta ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs uppercase text-blue-700">Propuesta enviada</p>
                      <p className="mt-1 font-semibold capitalize text-gray-900">
                        {formatDateLong(turno.fechaPropuesta)} - {turno.horaPropuesta} hs
                      </p>
                      {turno.observacionAdmin ? <p className="mt-2 text-sm text-gray-600">{turno.observacionAdmin}</p> : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 lg:min-w-56 lg:items-end">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(turno.estado)}`}>
                    {turno.estado}
                  </span>

                  {isPending(turno.estado) ? (
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleApprove(turno)}
                        disabled={updatingId === turno.id}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => openProposal(turno)}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Clock3 className="mr-1 h-4 w-4" />
                        Proponer
                      </button>
                      <button
                        type="button"
                        onClick={() => openReject(turno)}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  ) : isOpenStatus(turno.estado) ? (
                    <button
                      type="button"
                      onClick={() => openReject(turno)}
                      className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rechazar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {!filteredTurnos.length ? (
            <div className="card py-12 text-center text-gray-500">
              {turnos.length ? 'No hay turnos que coincidan con el filtro.' : 'No hay turnos registrados.'}
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

        <aside className="card h-fit xl:sticky xl:top-24">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
              <CalendarClock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Disponibilidad</h2>
          </div>

          <div className="max-h-[620px] space-y-4 overflow-y-auto pr-2">
            {availability.map((day) => (
              <div key={day.fecha} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize text-gray-900">{formatDateLabel(day.fecha)}</p>
                  <span className="text-xs font-medium text-gray-500">{day.horarios.length} libres</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.horarios.length ? (
                    day.horarios.map((slot) => (
                      <span key={slot} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {slot}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Sin horarios disponibles</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {proposingTurno ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Proponer otro horario</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {proposingTurno.socio || `Socio ${proposingTurno.idSocio}`}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Solicito {formatDateLong(proposingTurno.fecha)} - {proposingTurno.hora} hs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProposingId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar propuesta"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Dia disponible</label>
                <select
                  value={proposalForm.fechaPropuesta}
                  onChange={(event) => {
                    const nextDay = availability.find((day) => day.fecha === event.target.value)
                    setProposalForm((prev) => ({
                      ...prev,
                      fechaPropuesta: event.target.value,
                      horaPropuesta: nextDay?.horarios[0] || ''
                    }))
                  }}
                  className="input-field"
                  disabled={updatingId === proposingTurno.id}
                >
                  {availability.map((day) => (
                    <option key={day.fecha} value={day.fecha} disabled={!day.horarios.length}>
                      {formatDateLabel(day.fecha)} - {day.horarios.length} horarios
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Nota al socio</label>
                <input
                  value={proposalForm.observacionAdmin}
                  onChange={(event) => setProposalForm((prev) => ({ ...prev, observacionAdmin: event.target.value }))}
                  placeholder="Ej: se ofrece el primer horario disponible"
                  maxLength={TURNOS_REASON_MAX_LENGTH}
                  className="input-field"
                  disabled={updatingId === proposingTurno.id}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {sanitizePlainText(proposalForm.observacionAdmin).length}/{TURNOS_REASON_MAX_LENGTH} caracteres.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-gray-700">Horarios disponibles</p>
              {selectedProposalDay?.horarios?.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {selectedProposalDay.horarios.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setProposalForm((prev) => ({ ...prev, horaPropuesta: slot }))}
                      disabled={updatingId === proposingTurno.id}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        proposalForm.horaPropuesta === slot
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
                  No hay horarios disponibles para el dia seleccionado.
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setProposingId(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleProposal(proposingTurno)}
                disabled={updatingId === proposingTurno.id || !proposalForm.fechaPropuesta || !proposalForm.horaPropuesta}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="mr-2 h-4 w-4" />
                {updatingId === proposingTurno.id ? 'Enviando...' : 'Enviar propuesta'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectingTurno ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Rechazar turno</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {rejectingTurno.socio || `Socio ${rejectingTurno.idSocio}`}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDateLong(rejectingTurno.fecha)} - {rejectingTurno.hora} hs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar rechazo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">Motivo del rechazo</label>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={4}
                placeholder="Indica por que no se puede tomar este turno."
                maxLength={TURNOS_REASON_MAX_LENGTH}
                className="input-field"
                disabled={updatingId === rejectingTurno.id}
              />
              <p className="mt-2 text-xs text-gray-500">
                {sanitizePlainText(rejectReason).length}/{TURNOS_REASON_MAX_LENGTH} caracteres. Minimo 10.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingTurno)}
                disabled={updatingId === rejectingTurno.id || sanitizePlainText(rejectReason).length < 10}
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {updatingId === rejectingTurno.id ? 'Rechazando...' : 'Rechazar turno'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
