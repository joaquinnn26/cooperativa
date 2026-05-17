import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, FileText, PlusCircle, XCircle } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'

function estadoColor(estado) {
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

export default function SocioSolicitudesServicio() {
  const usuario = useAuthStore((state) => state.usuario)
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetchServiceRequests().then((data) => {
      setRequests(data.filter((item) => String(item.socioUsuario) === String(usuario)))
    })
  }, [fetchServiceRequests, usuario])

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => ['Pendiente', 'En revision'].includes(item.estado)).length,
      rejected: requests.filter((item) => item.estado === 'Rechazada').length
    }),
    [requests]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Solicitudes</h1>
          <p className="mt-2 text-gray-600">Consulta el estado, los documentos y cualquier motivo de rechazo.</p>
        </div>
        <Link
          to="/socio/solicitudes-servicio/nueva"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nueva solicitud
        </Link>
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
          <p className="text-sm text-gray-500">Rechazadas</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{summary.rejected}</p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.idSolicitudServicio} className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{request.servicioNombre}</h2>
                    <p className="text-sm text-gray-500">{formatDate(request.fechaSolicitud, 'es-AR')}</p>
                  </div>
                </div>
                <p className="max-w-3xl text-sm text-gray-700">{request.observaciones}</p>
                <div className="flex flex-wrap gap-2">
                  {request.documentos.map((documento) => (
                    <span key={documento.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {documento.nombre}
                    </span>
                  ))}
                </div>
                {request.motivoRechazo ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <strong>Motivo rechazo:</strong> {request.motivoRechazo}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 text-right">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoColor(request.estado)}`}>
                  {request.estado}
                </span>
                <p className="text-sm text-gray-500">Documentos: {request.documentos.length}</p>
              </div>
            </div>
          </div>
        ))}

        {!requests.length ? (
          <div className="card py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">No tienes solicitudes registradas.</p>
            <p className="mt-2 text-gray-500">Cuando crees una, la veras aqui con su estado actualizado.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
