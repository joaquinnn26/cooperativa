import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, PlusCircle, Search } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useReclamos } from '@/hooks/useReclamos.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { formatDate } from '@/utils/formatDate.js'
import { normalizeClaimStatus } from '@/utils/claimWorkflow.js'
import ReclamoModalDetalle from '@/features/socio/components/reclamos/ReclamoModalDetalle.jsx'

function statusStyles(status) {
  const normalized = normalizeClaimStatus(status)
  if (normalized === 'Resuelto') return 'bg-emerald-100 text-emerald-700'
  if (normalized === 'En proceso') return 'bg-sky-100 text-sky-700'
  if (normalized === 'Cancelado') return 'bg-gray-200 text-gray-700'
  return 'bg-amber-100 text-amber-700'
}

export default function ReclamosList() {
  const PAGE_SIZE = 10
  const { socioId, loadingSocio } = useCurrentSocio()
  const { reclamos, loading } = useReclamos(socioId)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [seleccionado, setSeleccionado] = useState(null)

  const statusOptions = useMemo(
    () => ['Todos', ...Array.from(new Set(reclamos.map((reclamo) => normalizeClaimStatus(reclamo.Estado)).filter(Boolean)))],
    [reclamos]
  )

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()

    return reclamos
      .filter((reclamo) => statusFilter === 'Todos' || normalizeClaimStatus(reclamo.Estado) === statusFilter)
      .filter((reclamo) =>
        [
          reclamo.idReclamo,
          reclamo.Tipo,
          reclamo.Descripcion,
          reclamo.Estado,
          reclamo.Fecha
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
  }, [filter, reclamos, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [currentPage, filtered])

  const summary = useMemo(
    () => ({
      total: reclamos.length,
      pendientes: reclamos.filter((reclamo) => normalizeClaimStatus(reclamo.Estado) === 'Pendiente').length,
      proceso: reclamos.filter((reclamo) => normalizeClaimStatus(reclamo.Estado) === 'En proceso').length,
      resueltos: reclamos.filter((reclamo) => normalizeClaimStatus(reclamo.Estado) === 'Resuelto').length
    }),
    [reclamos]
  )

  const resetToFirstPage = (callback) => {
    setPage(1)
    callback()
  }

  const isLoading = loading || loadingSocio

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis reclamos</h1>
          <p className="mt-1 text-gray-600">Consultá el estado de tus reclamos y registrá uno nuevo desde esta misma pantalla.</p>
        </div>
        <Link
          to="/socio/reclamos/nuevo"
          className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Registrar un reclamo
        </Link>
      </div>

      <section className="mb-4 grid gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('Todos'))}
          className={`rounded-lg border p-4 text-left ${statusFilter === 'Todos' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('Pendiente'))}
          className={`rounded-lg border p-4 text-left ${statusFilter === 'Pendiente' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{summary.pendientes}</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('En proceso'))}
          className={`rounded-lg border p-4 text-left ${statusFilter === 'En proceso' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">En proceso</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{summary.proceso}</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setStatusFilter('Resuelto'))}
          className={`rounded-lg border p-4 text-left ${statusFilter === 'Resuelto' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Resueltos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.resueltos}</p>
        </button>
      </section>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 px-4 py-4 md:grid-cols-[minmax(240px,1fr)_220px_auto] md:items-center">
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar por tipo, estado o descripcion..."
              className="w-full min-w-0 text-sm outline-none"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => resetToFirstPage(() => setStatusFilter(event.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'Todos' ? 'Todos los estados' : status}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">
            {isLoading ? 'Cargando...' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {isLoading ? (
          <p className="px-4 py-10 text-center text-gray-600">Cargando reclamos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Reclamo</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((reclamo) => (
                  <tr key={reclamo.idReclamo} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">#{reclamo.idReclamo} - {reclamo.Tipo || 'Sin tipo'}</p>
                      <p className="line-clamp-2 max-w-2xl text-xs text-gray-500">{reclamo.Descripcion || 'Sin descripcion'}</p>
                    </td>
                    <td className="px-4 py-3">{formatDate(reclamo.Fecha, 'es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(reclamo.Estado)}`}>
                        {normalizeClaimStatus(reclamo.Estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => setSeleccionado(reclamo)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filtered.length ? (
              <p className="py-10 text-center text-gray-500">No hay reclamos que coincidan.</p>
            ) : null}
          </div>
        )}

        {!isLoading && filtered.length ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500">
              Pagina {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pagina siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <ReclamoModalDetalle reclamo={seleccionado} onClose={() => setSeleccionado(null)} />
    </div>
  )
}
