import React, { useEffect, useMemo, useState } from 'react'
import { ClipboardList, MapPinned, Search } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { cargoMatches } from '@/utils/auth.js'
import { formatDate } from '@/utils/formatDate.js'

const ACTIVE_REQUEST_STATUSES = ['Pendiente', 'En revision', 'Aprobada']

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
      return 'bg-emerald-100 text-emerald-700'
    case 'En revision':
      return 'bg-violet-100 text-violet-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

export default function EmpleadoSolicitudesTecnicas() {
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const cargo = useAuthStore((state) => state.cargo)

  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchServiceRequests().then((data) => {
      setRequests((data || []).filter((request) => ACTIVE_REQUEST_STATUSES.includes(request.estado)))
    })
  }, [fetchServiceRequests])

  const isTecnico = cargoMatches(cargo, 'Tecnico')

  if (!isTecnico) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Esta vista solo esta disponible para empleados con cargo Tecnico. Tu cargo actual es: {cargo || 'No informado'}.
        </div>
      </div>
    )
  }

  const filteredRequests = useMemo(() => {
    const query = normalizeText(search)
    return requests.filter((request) =>
      normalizeText(
        [request.socioNombre, request.socioUsuario, request.servicioNombre, request.estado, request.direccion].join(' ')
      ).includes(query)
    )
  }, [requests, search])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes tecnicas</h1>
          <p className="mt-2 text-gray-600">Consulta solicitudes activas, su estado actual y la direccion donde debe instalarse el servicio.</p>
        </div>
        <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
          <ClipboardList className="h-6 w-6" />
        </div>
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

      <div className="grid gap-4">
        {filteredRequests.map((request) => (
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
          </article>
        ))}

        {!filteredRequests.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-gray-500">
            No hay solicitudes tecnicas activas para mostrar.
          </div>
        ) : null}
      </div>
    </div>
  )
}
