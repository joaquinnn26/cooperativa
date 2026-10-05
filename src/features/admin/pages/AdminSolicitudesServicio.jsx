import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Search,
  XCircle
} from 'lucide-react'
import { API_SERVER_URL } from '@/config/api.js'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'
import { eventosOperativosApi } from '@/utils/eventosOperativosApi.js'

const STATUS_FILTERS = ['Todas', 'Pendiente', 'En revision', 'Pendiente instalacion', 'Aprobada', 'Rechazada', 'Cancelada']

function statusColor(estado) {
  switch (estado) {
    case 'Pendiente':
      return 'bg-amber-100 text-amber-700'
    case 'Pendiente instalacion':
      return 'bg-teal-100 text-teal-700'
    case 'Aprobada':
      return 'bg-emerald-100 text-emerald-700'
    case 'Rechazada':
      return 'bg-red-100 text-red-700'
    case 'Cancelada':
      return 'bg-slate-200 text-slate-700'
    case 'En revision':
      return 'bg-violet-100 text-violet-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

function statusPriority(estado) {
  if (estado === 'Pendiente') return 0
  if (estado === 'En revision') return 1
  if (estado === 'Pendiente instalacion') return 2
  if (estado === 'Aprobada') return 3
  if (estado === 'Rechazada') return 4
  return 5
}

function canResolveDocuments(estado) {
  return estado === 'Pendiente' || estado === 'En revision' || estado === 'En Revision'
}

function documentUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function documentLabel(documento, index) {
  return documento.nombre || documento.NombreArchivo || documento.tipo || `Documento ${index + 1}`
}

function requestSearchText(request) {
  return [
    request.socioNombre,
    request.socioUsuario,
    request.servicioNombre,
    request.estado,
    request.direccion,
    request.observaciones,
    request.motivoRechazo
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function AdminSolicitudesServicio() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const approveServiceRequest = useServiceWorkflowStore((state) => state.approveServiceRequest)
  const rejectServiceRequest = useServiceWorkflowStore((state) => state.rejectServiceRequest)

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('En revision')
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectionMotives, setRejectionMotives] = useState([])
  const [saving, setSaving] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await fetchServiceRequests()
      setRequests(data || [])
      return data || []
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar las solicitudes.',
        type: 'error'
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [fetchServiceRequests])

  useEffect(() => {
    const abort = new AbortController()
    eventosOperativosApi('/motivos?contexto=SOLICITUD_SERVICIO_RECHAZO', { signal: abort.signal })
      .then(setRejectionMotives)
      .catch(() => { if (!abort.signal.aborted) setRejectionMotives([]) })
    return () => abort.abort()
  }, [])

  const summary = useMemo(
    () =>
      STATUS_FILTERS.slice(1).reduce((acc, status) => {
        acc[status] = requests.filter((request) => request.estado === status).length
        return acc
      }, {}),
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests
      .filter((request) => statusFilter === 'Todas' || request.estado === statusFilter)
      .filter((request) => !query || requestSearchText(request).includes(query))
      .sort((a, b) => {
        const priority = statusPriority(a.estado) - statusPriority(b.estado)
        if (priority !== 0) return priority
        return new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      })
  }, [requests, search, statusFilter])

  const selectedRequest = useMemo(
    () =>
      requests.find((request) => String(request.idSolicitudServicio) === String(selectedRequestId)) ||
      filteredRequests[0] ||
      null,
    [filteredRequests, requests, selectedRequestId]
  )

  useEffect(() => {
    if (!selectedRequest) {
      setSelectedRequestId(null)
      return
    }

    setSelectedRequestId(selectedRequest.idSolicitudServicio)
  }, [selectedRequest?.idSolicitudServicio])

  const handleApprove = async (request = selectedRequest) => {
    if (!request) return
    setSaving(true)
    try {
      await approveServiceRequest(request.idSolicitudServicio)
      addNotification({
        title: 'Solicitud aprobada',
        message: `Se aprobo la documentacion de ${request.servicioNombre} para ${request.socioNombre}.`,
        type: 'success'
      })
      await loadRequests()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aprobar la solicitud.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectingRequest || !rejectReason.trim()) return

    setSaving(true)
    try {
      await rejectServiceRequest(rejectingRequest.idSolicitudServicio, Number(rejectReason))
      addNotification({
        title: 'Solicitud rechazada',
        message: `Se rechazo ${rejectingRequest.servicioNombre}.`,
        type: 'success'
      })
      setRejectingRequest(null)
      setRejectReason('')
      await loadRequests()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo rechazar la solicitud.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revision de solicitudes</h1>
          <p className="mt-2 text-gray-600">Controla datos, documentacion y estado de cada pedido de servicio.</p>
        </div>
        <div className="rounded-full bg-sky-100 p-3 text-sky-700">
          <ClipboardList className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STATUS_FILTERS.slice(1).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              statusFilter === status ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-semibold uppercase text-gray-500">{status}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{summary[status] || 0}</p>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 lg:max-w-xl">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por socio, documento, servicio, estado o direccion..."
            className="w-full min-w-0 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              {filteredRequests.length} solicitud{filteredRequests.length === 1 ? '' : 'es'}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-10 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando solicitudes...
              </div>
            ) : null}

            {!loading &&
              filteredRequests.map((request) => {
                const selected = String(request.idSolicitudServicio) === String(selectedRequest?.idSolicitudServicio)
                return (
                  <button
                    key={request.idSolicitudServicio}
                    type="button"
                    onClick={() => setSelectedRequestId(request.idSolicitudServicio)}
                    className={`block w-full px-4 py-4 text-left transition ${
                      selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{request.socioNombre || 'Socio sin nombre'}</p>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(request.estado)}`}>
                            {request.estado}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {request.servicioNombre} · Doc. {request.socioUsuario || 'No informado'}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{request.observaciones || 'Sin observaciones'}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 xl:justify-end">
                        <span>{formatDate(request.fechaSolicitud, 'es-AR')}</span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {request.documentos.length}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}

            {!loading && !filteredRequests.length ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500">No hay solicitudes para mostrar.</div>
            ) : null}
          </div>
        </section>

        <aside className="rounded-lg border border-gray-200 bg-white">
          {selectedRequest ? (
            <>
              <div className="border-b border-gray-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase text-blue-600">Solicitud #{selectedRequest.idSolicitudServicio}</p>
                    <h2 className="mt-1 text-2xl font-bold text-gray-900">{selectedRequest.servicioNombre}</h2>
                    <p className="mt-1 text-sm text-gray-600">{selectedRequest.socioNombre} · {selectedRequest.socioUsuario}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(selectedRequest.estado)}`}>
                    {selectedRequest.estado}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs uppercase text-gray-500">Fecha</p>
                    <p className="mt-1 font-medium text-gray-900">{formatDate(selectedRequest.fechaSolicitud, 'es-AR')}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs uppercase text-gray-500">Documentos</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedRequest.documentos.length}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase text-gray-500">Direccion</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedRequest.direccion || 'No informada'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase text-gray-500">Observaciones</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedRequest.observaciones || 'Sin observaciones'}</p>
                </div>

                {selectedRequest.motivoRechazo ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p className="text-xs font-semibold uppercase">
                      {selectedRequest.estado === 'En revision' ? 'Motivo rechazo instalacion' : 'Motivo rechazo'}
                    </p>
                    <p className="mt-1">{selectedRequest.motivoRechazo}</p>
                  </div>
                ) : null}

                <div className="rounded-lg border border-gray-200">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">Documentacion</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedRequest.documentos.map((documento, index) => {
                      const href = documentUrl(documento.ruta || documento.RutaArchivo)
                      return (
                        <div key={documento.id || `${documentLabel(documento, index)}-${index}`} className="flex items-center justify-between gap-3 px-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{documentLabel(documento, index)}</p>
                            <p className="text-xs text-gray-500">{documento.tipo || documento.TipoArchivo || 'Archivo'}</p>
                          </div>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              Abrir
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Sin enlace</span>
                          )}
                        </div>
                      )
                    })}

                    {!selectedRequest.documentos.length ? (
                      <div className="px-3 py-5 text-sm text-gray-500">No hay documentos cargados.</div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleApprove()}
                    disabled={saving || !canResolveDocuments(selectedRequest.estado)}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprobar documentacion
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingRequest(selectedRequest)}
                    disabled={saving || !canResolveDocuments(selectedRequest.estado)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">Selecciona una solicitud para revisar sus datos.</div>
          )}
        </aside>
      </div>

      {rejectingRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Rechazar solicitud</h2>
            <p className="mt-2 text-gray-600">
              Indica el motivo de rechazo para {rejectingRequest.socioNombre}.
            </p>

            <label className="mt-5 block text-sm font-medium text-gray-700">Motivo
              <select className="input-field mt-1" value={rejectReason} onChange={event => setRejectReason(event.target.value)}>
                <option value="">Seleccioná un motivo</option>
                {rejectionMotives.filter(m => m.Codigo !== 'ENERGIA_REQUISITO_PILAR' || /luz|energ|electr/i.test(rejectingRequest.servicioNombre || '')).map(m => <option key={m.idMotivoEvento} value={m.idMotivoEvento}>{m.Nombre}</option>)}
              </select>
            </label>
            {!rejectionMotives.length && <p role="status" className="mt-2 text-sm text-amber-800">No hay motivos confirmados disponibles. Revisá la migración y el catálogo de motivos antes de rechazar.</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingRequest(null)
                  setRejectReason('')
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={saving || !rejectReason.trim() || !rejectionMotives.length}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
