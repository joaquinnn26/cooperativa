import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Eye, Search, XCircle } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'

function statusColor(estado) {
  switch (estado) {
    case 'Aprobada':
      return 'bg-emerald-100 text-emerald-700'
    case 'Rechazada':
      return 'bg-red-100 text-red-700'
    case 'En revision':
      return 'bg-violet-100 text-violet-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

export default function AdminSolicitudesServicio() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const approveServiceRequest = useServiceWorkflowStore((state) => state.approveServiceRequest)
  const rejectServiceRequest = useServiceWorkflowStore((state) => state.rejectServiceRequest)

  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadRequests = async () => {
    const data = await fetchServiceRequests()
    setRequests(data)
  }

  useEffect(() => {
    loadRequests()
  }, [fetchServiceRequests])

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase()
    return requests.filter((request) =>
      [
        request.socioNombre,
        request.socioUsuario,
        request.servicioNombre,
        request.estado,
        request.observaciones
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [requests, search])

  const handleApprove = async (request) => {
    try {
      await approveServiceRequest(request.idSolicitudServicio)
      addNotification({
        title: 'Solicitud aprobada',
        message: `Se aprobo ${request.servicioNombre} para ${request.socioNombre}.`,
        type: 'success'
      })
      await loadRequests()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aprobar la solicitud.',
        type: 'error'
      })
    }
  }

  const handleReject = async () => {
    if (!rejectingRequest || !rejectReason.trim()) return

    try {
      await rejectServiceRequest(rejectingRequest.idSolicitudServicio, rejectReason.trim())
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
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Solicitudes</h1>
          <p className="mt-2 text-gray-600">Aprueba o rechaza servicios y revisa la documentacion cargada.</p>
        </div>
        <div className="rounded-full bg-sky-100 p-3 text-sky-700">
          <ClipboardList className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-4 py-3 md:max-w-md">
        <Search className="h-4 w-4 text-gray-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por socio, servicio o estado..."
          className="w-full text-sm outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Documentos</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => {
              const closed = ['Aprobada', 'Rechazada'].includes(request.estado)
              return (
                <tr key={request.idSolicitudServicio} className="border-t border-gray-100">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-900">{request.socioNombre}</p>
                    <p className="text-xs text-gray-500">{request.socioUsuario}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{request.servicioNombre}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{request.observaciones}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{formatDate(request.fechaSolicitud, 'es-AR')}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(request.estado)}`}>
                      {request.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4">{request.documentos.length}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(request)}
                        disabled={closed}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingRequest(request)}
                        disabled={closed}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!filteredRequests.length ? (
          <div className="py-12 text-center text-gray-500">No hay solicitudes para mostrar.</div>
        ) : null}
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.servicioNombre}</h2>
                <p className="text-gray-600">{selectedRequest.socioNombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Fecha</p>
                <p className="mt-1 font-medium text-gray-900">{formatDate(selectedRequest.fechaSolicitud, 'es-AR')}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Estado</p>
                <p className="mt-1 font-medium text-gray-900">{selectedRequest.estado}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Observaciones</p>
              <p className="mt-1 text-gray-800">{selectedRequest.observaciones}</p>
            </div>

            {selectedRequest.motivoRechazo ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="text-xs uppercase">Motivo rechazo</p>
                <p className="mt-1">{selectedRequest.motivoRechazo}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Documentos</p>
              <div className="mt-2 space-y-2">
                {selectedRequest.documentos.map((documento) => (
                  <div key={documento.id} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800">
                    {documento.nombre}
                  </div>
                ))}
                {!selectedRequest.documentos.length ? (
                  <p className="text-sm text-gray-500">No hay documentos.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rejectingRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Rechazar solicitud</h2>
            <p className="mt-2 text-gray-600">
              Indica el motivo de rechazo para {rejectingRequest.socioNombre}.
            </p>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="input-field mt-5 min-h-32"
              placeholder="Motivo del rechazo"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingRequest(null)
                  setRejectReason('')
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
