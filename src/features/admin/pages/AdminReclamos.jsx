import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Phone, Search, X } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import { formatDate } from '@/utils/formatDate.js'
import {
  CLAIM_STATUS_OPTIONS,
  getAllowedClaimStatuses,
  getClaimStatusId,
  isValidClaimTransition,
  normalizeClaimStatus
} from '@/utils/claimWorkflow.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

function getJsonHeaders() {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  }
}

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.value)) return data.value
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.reclamos)) return data.reclamos
  return []
}

function sanitizeClaims(items) {
  return ensureArray(items).filter((item) => item && typeof item === 'object')
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path), { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function readError(response, fallback) {
  const errorText = await response.text()
  if (!errorText) return fallback

  try {
    const parsed = JSON.parse(errorText)
    return parsed.Message || parsed.message || parsed.mensaje || fallback
  } catch {
    return errorText
  }
}

function statusStyles(status) {
  const normalized = normalizeClaimStatus(status)
  if (normalized === 'Resuelto') return 'bg-emerald-100 text-emerald-700'
  if (normalized === 'En proceso') return 'bg-sky-100 text-sky-700'
  if (normalized === 'Cancelado') return 'bg-gray-200 text-gray-700'
  return 'bg-amber-100 text-amber-700'
}

function safeFormatDate(value) {
  if (!value) return 'Sin fecha'

  try {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Sin fecha'
    return formatDate(parsed, 'es-AR')
  } catch {
    return 'Sin fecha'
  }
}

function formatSocioName(value) {
  if (!value) return 'Sin socio'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const fullName = [value.Nombre, value.Apellido].filter(Boolean).join(' ').trim()
    if (fullName) return fullName
    if (value.nombre || value.apellido) {
      return [value.nombre, value.apellido].filter(Boolean).join(' ').trim()
    }
  }
  return 'Sin socio'
}

function formatDocumento(value, fallbackSource) {
  if (value && (typeof value === 'string' || typeof value === 'number')) return String(value)
  if (value && typeof value === 'object') {
    return String(value.Documento ?? value.documento ?? 'Sin documento')
  }
  if (fallbackSource && typeof fallbackSource === 'object') {
    return String(fallbackSource.Documento ?? fallbackSource.documento ?? 'Sin documento')
  }
  return 'Sin documento'
}

function formatTextValue(value, fallback = '') {
  if (value == null || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return fallback
}

export default function AdminReclamos() {
  const [claims, setClaims] = useState([])
  const [sociosDirectory, setSociosDirectory] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [editingStatus, setEditingStatus] = useState('Pendiente')
  const [savingStatus, setSavingStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    fetchJson('/reclamo')
      .then((data) => setClaims(sanitizeClaims(data)))
      .catch((fetchError) => {
        console.error('Error al obtener reclamos:', fetchError)
        setClaims([])
        setError('No se pudieron cargar los reclamos.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchJson('/socio')
      .then((data) => setSociosDirectory(ensureArray(data)))
      .catch(() => setSociosDirectory([]))
  }, [])

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase()
    return claims.filter((claim) => {
      const currentStatus = normalizeClaimStatus(claim.Estado ?? claim.estado)
      const matchesStatus = statusFilter === 'Todos' || currentStatus === statusFilter
      if (!matchesStatus) return false
      if (!query) return true

      return [
        claim.idReclamo ?? claim.IdReclamo,
        claim.Socio ?? claim.NombreSocio,
        claim.Documento ?? claim.NroDocumento,
        claim.Tipo ?? claim.TipoReclamo,
        claim.Descripcion ?? claim.descripcion,
        claim.Estado ?? claim.estado
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [claims, search, statusFilter])

  const getClaimValue = (claim, keys, fallback = '') => {
    for (const key of keys) {
      if (claim?.[key] !== undefined && claim?.[key] !== null && claim?.[key] !== '') {
        return claim[key]
      }
    }
    return fallback
  }

  const getClaimId = (claim, index) => getClaimValue(claim, ['idReclamo', 'IdReclamo'], `reclamo-${index}`)
  const resolvePhone = (claim) => {
    const direct = formatTextValue(
      getClaimValue(claim, ['Telefono', 'telefono', 'Celular', 'celular'], '')
    )
    if (direct) return direct

    const socioObject = getClaimValue(claim, ['Socio'])
    const socioPhone = formatTextValue(socioObject?.Telefono ?? socioObject?.telefono, '')
    if (socioPhone) return socioPhone

    const claimSocioId = String(
      getClaimValue(claim, ['idSocio', 'IdSocio'], socioObject?.idSocio ?? socioObject?.IdSocio ?? '')
    )
    const claimDocumento = formatDocumento(getClaimValue(claim, ['Documento', 'NroDocumento']), socioObject)

    const matchedSocio = sociosDirectory.find((item) => {
      const sameId = claimSocioId && String(item.idSocio ?? item.IdSocio ?? '') === claimSocioId
      const sameDoc =
        claimDocumento &&
        String(item.Persona?.Documento ?? item.Documento ?? '') === String(claimDocumento)
      return sameId || sameDoc
    })

    return formatTextValue(matchedSocio?.Persona?.Telefono ?? matchedSocio?.Telefono, '')
  }

  const buildTelHref = (phone) => {
    const normalized = String(phone || '').replace(/[^\d+]/g, '')
    return normalized ? `tel:${normalized}` : ''
  }
  const normalizedStatusOptions = useMemo(
    () => ['Todos', ...CLAIM_STATUS_OPTIONS.map((item) => item.NombreEstado)],
    []
  )

  const openClaimManager = (claim) => {
    const currentStatus = normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'], 'Pendiente'))
    setError('')
    setSelectedClaim(claim)
    setEditingStatus(currentStatus)
  }

  const closeClaimManager = () => {
    setSelectedClaim(null)
    setEditingStatus('Pendiente')
    setSavingStatus(false)
  }

  const getStatusId = (statusName) => {
    const match = CLAIM_STATUS_OPTIONS.find(
      (item) => normalizeClaimStatus(item.NombreEstado) === normalizeClaimStatus(statusName)
    )
    return match?.idEstadoReclamo ?? getClaimStatusId(statusName)
  }

  const updateClaimStatus = async () => {
    if (!selectedClaim) return

    const claimId = getClaimValue(selectedClaim, ['idReclamo', 'IdReclamo'])
    const currentStatus = normalizeClaimStatus(getClaimValue(selectedClaim, ['Estado', 'estado'], 'Pendiente'))
    const nextStatusId = getStatusId(editingStatus)
    if (!claimId || !nextStatusId) {
      setError('No se pudo identificar el reclamo o el estado seleccionado.')
      return
    }
    if (!isValidClaimTransition(currentStatus, editingStatus)) {
      setError(`No se permite cambiar un reclamo de ${currentStatus} a ${editingStatus}.`)
      return
    }
    if (currentStatus === editingStatus) {
      closeClaimManager()
      return
    }

    setSavingStatus(true)
    setError('')

    try {
      const response = await fetch(apiUrl(`/reclamo/${claimId}`), {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify({ idEstadoReclamo: nextStatusId })
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'No se pudo actualizar el estado del reclamo.'))
      }

      setClaims((current) =>
        current.map((claim) =>
          String(getClaimValue(claim, ['idReclamo', 'IdReclamo'])) === String(claimId)
            ? {
                ...claim,
                Estado: editingStatus,
                estado: editingStatus,
                ...(nextStatusId ? { idEstadoReclamo: nextStatusId, IdEstadoReclamo: nextStatusId } : {})
              }
            : claim
        )
      )

      closeClaimManager()
    } catch (updateError) {
      setError(updateError.message || 'No se pudo actualizar el estado del reclamo.')
    } finally {
      setSavingStatus(false)
    }
  }

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
            {claims.filter((claim) => normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'])) === 'Pendiente').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">En proceso</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">
            {claims.filter((claim) => normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'])) === 'En proceso').length}
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Listado</h2>
            <p className="text-sm text-gray-500">{filteredClaims.length} reclamo(s)</p>
          </div>
          <div className="flex flex-col gap-3 md:w-auto md:flex-row">
            <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 md:w-52">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full text-sm outline-none"
              >
                {normalizedStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'Todos' ? 'Todos los estados' : status}
                  </option>
                ))}
              </select>
            </label>
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
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Cargando reclamos...</div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading ? (
          <div className="space-y-4 md:hidden">
            {filteredClaims.map((claim, index) => (
              <div key={getClaimId(claim, index)} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    Reclamo #{getClaimValue(claim, ['idReclamo', 'IdReclamo'], '-')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatSocioName(getClaimValue(claim, ['Socio', 'NombreSocio']))}
                  </p>
                  <p className="text-xs text-gray-500">
                    Doc.{' '}
                    {formatDocumento(
                      getClaimValue(claim, ['Documento', 'NroDocumento']),
                      getClaimValue(claim, ['Socio'])
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(
                    getClaimValue(claim, ['Estado', 'estado'])
                  )}`}
                >
                  {normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado']))}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900">
                    {formatTextValue(getClaimValue(claim, ['Tipo', 'TipoReclamo']), 'Sin tipo')}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900">
                    {safeFormatDate(getClaimValue(claim, ['Fecha', 'fecha']))}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Descripcion</p>
                  <p className="text-sm text-gray-700">
                    {formatTextValue(getClaimValue(claim, ['Descripcion', 'descripcion']), 'Sin descripcion')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openClaimManager(claim)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Gestionar
                </button>
                {resolvePhone(claim) ? (
                  <a
                    href={buildTelHref(resolvePhone(claim))}
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Llamar
                  </a>
                ) : null}
              </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading ? (
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
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim, index) => (
                  <tr key={getClaimId(claim, index)} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">{getClaimValue(claim, ['idReclamo', 'IdReclamo'], '-')}</td>
                    <td className="px-4 py-3">{formatSocioName(getClaimValue(claim, ['Socio', 'NombreSocio']))}</td>
                    <td className="px-4 py-3">
                      {formatDocumento(
                        getClaimValue(claim, ['Documento', 'NroDocumento']),
                        getClaimValue(claim, ['Socio'])
                      )}
                    </td>
                    <td className="px-4 py-3">{formatTextValue(getClaimValue(claim, ['Tipo', 'TipoReclamo']), 'Sin tipo')}</td>
                    <td className="px-4 py-3">{safeFormatDate(getClaimValue(claim, ['Fecha', 'fecha']))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(
                          getClaimValue(claim, ['Estado', 'estado'])
                        )}`}
                      >
                      {normalizeClaimStatus(formatTextValue(getClaimValue(claim, ['Estado', 'estado']), 'Sin estado'))}
                    </span>
                  </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatTextValue(getClaimValue(claim, ['Descripcion', 'descripcion']), 'Sin descripcion')}
                    </td>
                    <td className="px-4 py-3">{resolvePhone(claim) || 'No informado'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openClaimManager(claim)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Gestionar
                        </button>
                        {resolvePhone(claim) ? (
                          <a
                            href={buildTelHref(resolvePhone(claim))}
                            className="inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            <Phone className="mr-1 h-3.5 w-3.5" />
                            Llamar
                          </a>
                        ) : null}
                      </div>
                    </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && !filteredClaims.length ? (
          <div className="py-10 text-center text-gray-500">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            {search ? 'No hay reclamos que coincidan con la busqueda.' : 'Todavia no hay reclamos registrados.'}
          </div>
        ) : null}
      </div>

      {selectedClaim ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-3 md:flex md:items-center md:justify-center md:p-4" onClick={closeClaimManager}>
          <div
            className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:h-auto md:max-h-[88vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 md:px-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestionar reclamo</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Reclamo #{getClaimValue(selectedClaim, ['idReclamo', 'IdReclamo'], '-')}
                </p>
              </div>
              <button
                type="button"
                onClick={closeClaimManager}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">Socio</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatSocioName(getClaimValue(selectedClaim, ['Socio', 'NombreSocio']))}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Documento:{' '}
                    {formatDocumento(
                      getClaimValue(selectedClaim, ['Documento', 'NroDocumento']),
                      getClaimValue(selectedClaim, ['Socio'])
                    )}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">Telefono: {resolvePhone(selectedClaim) || 'No informado'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">Tipo</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatTextValue(getClaimValue(selectedClaim, ['Tipo', 'TipoReclamo']), 'Sin tipo')}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Fecha: {safeFormatDate(getClaimValue(selectedClaim, ['Fecha', 'fecha']))}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Descripcion</p>
                <p className="mt-1 text-sm text-gray-700">
                  {formatTextValue(getClaimValue(selectedClaim, ['Descripcion', 'descripcion']), 'Sin descripcion')}
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Estado del reclamo</label>
                <select
                  value={editingStatus}
                  onChange={(event) => setEditingStatus(event.target.value)}
                  className="input-field"
                  disabled={savingStatus}
                >
                  {getAllowedClaimStatuses(
                    getClaimValue(selectedClaim, ['Estado', 'estado'], 'Pendiente')
                  )
                    .map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-4 md:px-6">
              <button
                type="button"
                onClick={closeClaimManager}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={updateClaimStatus}
                disabled={savingStatus}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingStatus ? 'Guardando...' : 'Guardar estado'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
