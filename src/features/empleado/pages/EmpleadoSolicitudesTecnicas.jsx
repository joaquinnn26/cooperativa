import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Loader2, MapPinned, Search } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { normalizeCargo } from '@/utils/auth.js'
import { formatDate } from '@/utils/formatDate.js'
import { serviceRequiresInstallation } from '@/utils/serviceInstallation.js'

const INSTALLATION_REQUEST_STATUSES = ['Pendiente instalacion', 'Instalada']
const STATUS_FILTERS = [
  { value: 'Pendiente instalacion', label: 'Pendientes' },
  { value: 'Instalada', label: 'Instaladas' },
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
    case 'Instalada':
      return 'bg-cyan-100 text-cyan-700'
    case 'Pendiente instalacion':
      return 'bg-emerald-100 text-emerald-700'
    case 'En revision':
      return 'bg-violet-100 text-violet-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

export default function EmpleadoSolicitudesTecnicas() {
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const markServiceRequestInstalled = useServiceWorkflowStore((state) => state.markServiceRequestInstalled)
  const cargo = useAuthStore((state) => state.cargo)

  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Pendiente instalacion')

  useEffect(() => {
    let mounted = true

    async function loadRequests() {
      setLoading(true)
      try {
        const data = await fetchServiceRequests()
        if (!mounted) return
        setRequests(
          (data || []).filter(
            (request) =>
              serviceRequiresInstallation(request.servicioNombre) &&
              INSTALLATION_REQUEST_STATUSES.includes(request.estado)
          )
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadRequests()
    return () => {
      mounted = false
    }
  }, [fetchServiceRequests])

  const isTecnico = normalizeCargo(cargo) === 'tecnico'

  const filteredRequests = useMemo(() => {
    const query = normalizeText(search)
    return requests
      .filter((request) => statusFilter === 'Todas' || request.estado === statusFilter)
      .filter((request) =>
        normalizeText(
          [request.socioNombre, request.socioUsuario, request.servicioNombre, request.estado, request.direccion].join(' ')
        ).includes(query)
      )
  }, [requests, search, statusFilter])

  const summary = useMemo(
    () => ({
      'Pendiente instalacion': requests.filter((request) => request.estado === 'Pendiente instalacion').length,
      Instalada: requests.filter((request) => request.estado === 'Instalada').length,
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
      const data = await fetchServiceRequests()
      setRequests(
        (data || []).filter(
          (item) =>
            serviceRequiresInstallation(item.servicioNombre) &&
            INSTALLATION_REQUEST_STATUSES.includes(item.estado)
        )
      )
      setStatusFilter('Instalada')
      setFeedback({ type: 'success', message: `La solicitud de ${request.socioNombre} quedo marcada como instalada.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No se pudo actualizar la instalacion.' })
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
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes tecnicas</h1>
          <p className="mt-2 text-gray-600">Consulta servicios pendientes de instalacion, revisa la direccion y registra el trabajo terminado.</p>
        </div>
        <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
          <ClipboardList className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
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
            Cargando solicitudes de instalacion...
          </div>
        ) : null}

        {!loading && filteredRequests.map((request) => (
          <article key={request.idSolicitudServicio} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{request.servicioNombre}</h2>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(request.estado)}`}>
                    {request.estado}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {request.socioNombre} · Doc. {request.socioUsuario || 'Sin documento'}
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

            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {request.estado === 'Instalada'
                  ? 'Instalacion registrada.'
                  : 'Pendiente de instalacion tecnica.'}
              </p>
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
                {request.estado === 'Instalada' ? 'Instalada' : 'Marcar instalada'}
              </button>
            </div>
          </article>
        ))}

        {!loading && !filteredRequests.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-gray-500">
            No hay solicitudes de instalacion para mostrar.
          </div>
        ) : null}
      </div>
    </div>
  )
}
