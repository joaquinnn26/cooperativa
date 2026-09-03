import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Loader2, MapPinned, Search, XCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { normalizeCargo } from '@/utils/auth.js'
import { formatDate } from '@/utils/formatDate.js'
import { serviceRequiresInstallation } from '@/utils/serviceInstallation.js'
import { cleanText, FIELD_LIMITS, validateMeaningfulText } from '@/utils/validation.js'

const STATUS_FILTERS = [
  { value: 'Pendiente instalacion', label: 'Pendientes' },
  { value: 'Aprobada', label: 'Instaladas' },
  { value: 'Rechazada instalacion', label: 'Rechazadas' },
  { value: 'Todas', label: 'Todas' }
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function statusColor(estado) {
  switch (estado) {
    case 'Aprobada':
      return 'bg-cyan-100 text-cyan-700'
    case 'Pendiente instalacion':
      return 'bg-emerald-100 text-emerald-700'
    case 'Rechazada instalacion':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

function installationStatus(request) {
  if (request.estado === 'En revision' && request.motivoRechazo) return 'Rechazada instalacion'
  return request.estado
}

function isInstallationRequest(request) {
  if (!serviceRequiresInstallation(request.servicioNombre)) return false
  return ['Pendiente instalacion', 'Aprobada', 'Rechazada instalacion'].includes(installationStatus(request))
}

export default function EmpleadoInstalaciones() {
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const markServiceRequestInstalled = useServiceWorkflowStore((state) => state.markServiceRequestInstalled)
  const rejectServiceInstallation = useServiceWorkflowStore((state) => state.rejectServiceInstallation)
  const cargo = useAuthStore((state) => state.cargo)

  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Pendiente instalacion')
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await fetchServiceRequests()
      setRequests((data || []).filter(isInstallationRequest))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [fetchServiceRequests])

  const isTecnico = normalizeCargo(cargo) === 'tecnico'

  const filteredRequests = useMemo(() => {
    const query = normalizeText(search)
    return requests
      .filter((request) => statusFilter === 'Todas' || installationStatus(request) === statusFilter)
      .filter((request) =>
        normalizeText(
          [
            request.socioNombre,
            request.socioUsuario,
            request.servicioNombre,
            installationStatus(request),
            request.estado,
            request.direccion,
            request.motivoRechazo
          ].join(' ')
        ).includes(query)
      )
  }, [requests, search, statusFilter])

  const summary = useMemo(
    () => ({
      'Pendiente instalacion': requests.filter((request) => installationStatus(request) === 'Pendiente instalacion').length,
      Aprobada: requests.filter((request) => installationStatus(request) === 'Aprobada').length,
      'Rechazada instalacion': requests.filter((request) => installationStatus(request) === 'Rechazada instalacion').length,
      Todas: requests.length
    }),
    [requests]
  )

  const handleMarkInstalled = async (request) => {
    setSavingId(request.idSolicitudServicio)
    setFeedback(null)

    try {
      await markServiceRequestInstalled(request.idSolicitudServicio, {
        observaciones: `Instalacion confirmada por tecnico el ${new Date().toLocaleDateString('es-AR')}.`
      })
      await loadRequests()
      setStatusFilter('Aprobada')
      setFeedback({ type: 'success', message: `La solicitud de ${request.socioNombre} quedo aprobada e instalada.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No se pudo actualizar la instalacion.' })
    } finally {
      setSavingId(null)
    }
  }

  const handleRejectInstallation = async () => {
    if (!rejectingRequest || !rejectReason.trim()) return

    const validationError = validateMeaningfulText(rejectReason, 'El motivo', FIELD_LIMITS.rejectionReason)
    if (validationError) {
      setFeedback({ type: 'error', message: validationError })
      return
    }

    setSavingId(rejectingRequest.idSolicitudServicio)
    setFeedback(null)

    try {
      await rejectServiceInstallation(rejectingRequest.idSolicitudServicio, cleanText(rejectReason))
      await loadRequests()
      setRejectingRequest(null)
      setRejectReason('')
      setStatusFilter('Rechazada instalacion')
      setFeedback({ type: 'success', message: 'La instalacion se rechazo y la solicitud volvio a revision.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No se pudo rechazar la instalacion.' })
    } finally {
      setSavingId(null)
    }
  }

  if (!isTecnico) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Esta vista solo esta disponible para empleados con cargo Tecnico. Tu cargo actual es: {cargo || 'No informado'}.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instalaciones</h1>
          <p className="mt-2 text-gray-600">Consulta instalaciones pendientes, aprobadas y rechazadas por el tecnico.</p>
        </div>
        <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
          <ClipboardList className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              statusFilter === filter.value ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-semibold uppercase text-gray-500">{filter.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{summary[filter.value] || 0}</p>
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-xl border bg-white px-4 py-3 md:max-w-md">
        <Search className="h-4 w-4 text-gray-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por socio, servicio, estado o direccion..."
          className="w-full text-sm outline-none"
        />
      </div>

      {feedback ? (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando instalaciones...
          </div>
        ) : null}

        {!loading && filteredRequests.map((request) => (
          <article key={request.idSolicitudServicio} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{request.servicioNombre}</h2>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(installationStatus(request))}`}>
                    {installationStatus(request)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {request.socioNombre} - Doc. {request.socioUsuario || 'Sin documento'}
                </p>
                <p className="mt-2 text-sm text-gray-500">Solicitada el {formatDate(request.fechaSolicitud, 'es-AR')}</p>
              </div>

              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 md:min-w-80">
                <div className="flex items-start gap-2">
                  <MapPinned className="mt-0.5 h-4 w-4 text-cyan-700" />
                  <div>
                    <p className="font-semibold text-gray-900">Direccion de instalacion</p>
                    <p>{request.direccion}</p>
                  </div>
                </div>
              </div>
            </div>

            {request.observaciones ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Observaciones</p>
                <p className="mt-1">{request.observaciones}</p>
              </div>
            ) : null}

            {installationStatus(request) === 'Rechazada instalacion' && request.motivoRechazo ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Motivo rechazo instalacion</p>
                <p className="mt-1">{request.motivoRechazo}</p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {installationStatus(request) === 'Aprobada'
                  ? 'Instalacion registrada.'
                  : installationStatus(request) === 'Rechazada instalacion'
                    ? 'Instalacion rechazada y devuelta a revision.'
                    : 'Pendiente de instalacion tecnica.'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleMarkInstalled(request)}
                  disabled={savingId === request.idSolicitudServicio || request.estado !== 'Pendiente instalacion'}
                  className="inline-flex items-center justify-center rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingId === request.idSolicitudServicio ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {installationStatus(request) === 'Aprobada' ? 'Instalada' : 'Marcar instalada'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingRequest(request)}
                  disabled={savingId === request.idSolicitudServicio || request.estado !== 'Pendiente instalacion'}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar instalacion
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && !filteredRequests.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-gray-500">
            No hay instalaciones para mostrar.
          </div>
        ) : null}
      </div>

      {rejectingRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Rechazar instalacion</h2>
            <p className="mt-2 text-gray-600">
              Indica el motivo para {rejectingRequest.socioNombre}.
            </p>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              minLength={FIELD_LIMITS.rejectionReason.min}
              maxLength={FIELD_LIMITS.rejectionReason.max}
              className="input-field mt-5 min-h-32"
              placeholder="Motivo de rechazo de instalacion"
            />
            <p className="mt-2 text-xs text-gray-500">
              {cleanText(rejectReason).length}/{FIELD_LIMITS.rejectionReason.max} caracteres. Minimo {FIELD_LIMITS.rejectionReason.min}.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingRequest(null)
                  setRejectReason('')
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                disabled={Boolean(savingId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRejectInstallation}
                disabled={Boolean(savingId) || !rejectReason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingId ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
