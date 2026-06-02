import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import { formatDate } from '@/utils/formatDate.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.value)) return data.value
  if (Array.isArray(data?.data)) return data.data
  return []
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path), { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function normalizeClaimStatus(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value.includes('resuelto')) return 'Resuelto'
  if (value.includes('proceso')) return 'En proceso'
  if (value.includes('pend')) return 'Pendiente'
  return status || 'Sin estado'
}

function statusStyles(status) {
  const normalized = normalizeClaimStatus(status)
  if (normalized === 'Resuelto') return 'bg-emerald-100 text-emerald-700'
  if (normalized === 'En proceso') return 'bg-sky-100 text-sky-700'
  return 'bg-amber-100 text-amber-700'
}

export default function AdminReclamos() {
  const [claims, setClaims] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchJson('/reclamo')
      .then((data) => setClaims(ensureArray(data)))
      .catch(() => setClaims([]))
  }, [])

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return claims

    return claims.filter((claim) =>
      [
        claim.idReclamo,
        claim.Socio,
        claim.Documento,
        claim.Tipo,
        claim.Descripcion,
        claim.Estado
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [claims, search])

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reclamos</h1>
        <p className="mt-2 text-gray-600">Consulta los reclamos registrados por los socios y su estado actual.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{claims.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {claims.filter((claim) => normalizeClaimStatus(claim.Estado) === 'Pendiente').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">En proceso</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">
            {claims.filter((claim) => normalizeClaimStatus(claim.Estado) === 'En proceso').length}
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Listado</h2>
            <p className="text-sm text-gray-500">{filteredClaims.length} reclamo(s)</p>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 md:w-96">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por socio, documento, tipo o descripcion..."
              className="w-full text-sm outline-none"
            />
          </label>
        </div>

        <div className="space-y-4 md:hidden">
          {filteredClaims.map((claim) => (
            <div key={claim.idReclamo} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">Reclamo #{claim.idReclamo}</p>
                  <p className="text-sm text-gray-600">{claim.Socio || 'Sin socio'}</p>
                  <p className="text-xs text-gray-500">Doc. {claim.Documento || 'Sin documento'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(claim.Estado)}`}>
                  {normalizeClaimStatus(claim.Estado)}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900">{claim.Tipo || 'Sin tipo'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900">{formatDate(claim.Fecha, 'es-AR')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Descripcion</p>
                  <p className="text-sm text-gray-700">{claim.Descripcion || 'Sin descripcion'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.idReclamo} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-900">{claim.idReclamo}</td>
                  <td className="px-4 py-3">{claim.Socio || 'Sin socio'}</td>
                  <td className="px-4 py-3">{claim.Documento || 'Sin documento'}</td>
                  <td className="px-4 py-3">{claim.Tipo || 'Sin tipo'}</td>
                  <td className="px-4 py-3">{formatDate(claim.Fecha, 'es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(claim.Estado)}`}>
                      {normalizeClaimStatus(claim.Estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{claim.Descripcion || 'Sin descripcion'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredClaims.length ? (
          <div className="py-10 text-center text-gray-500">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            {search ? 'No hay reclamos que coincidan con la busqueda.' : 'Todavia no hay reclamos registrados.'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
