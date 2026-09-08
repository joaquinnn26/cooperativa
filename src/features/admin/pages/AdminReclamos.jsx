import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Phone, Search, Table, X } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import { exportTable } from '@/utils/exportTable.js'
import { formatDate } from '@/utils/formatDate.js'
import { cleanText, FIELD_LIMITS, validateMeaningfulText } from '@/utils/validation.js'
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exporting, setExporting] = useState(null)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [editingStatus, setEditingStatus] = useState('Pendiente')
  const [finalResponse, setFinalResponse] = useState('')
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

  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredClaims.slice(start, start + pageSize)
  }, [currentPage, filteredClaims, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const summary = useMemo(
    () => ({
      total: claims.length,
      pendientes: claims.filter((claim) => normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'])) === 'Pendiente').length,
      proceso: claims.filter((claim) => normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'])) === 'En proceso').length,
      resueltos: claims.filter((claim) => normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'])) === 'Resuelto').length
    }),
    [claims]
  )

  const resetToFirstPage = (callback) => {
    setPage(1)
    callback()
  }
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
    setFinalResponse(formatTextValue(getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal']), ''))
  }

  const closeClaimManager = () => {
    setSelectedClaim(null)
    setEditingStatus('Pendiente')
    setFinalResponse('')
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

    if (normalizeClaimStatus(editingStatus) === 'Resuelto') {
      const validationError = validateMeaningfulText(finalResponse, 'La respuesta final', {
        min: FIELD_LIMITS.rejectionReason.min,
        max: 500
      })
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setSavingStatus(true)
    setError('')

    try {
      const response = await fetch(apiUrl(`/reclamo/${claimId}`), {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify({
          idEstadoReclamo: nextStatusId,
          RespuestaFinal: normalizeClaimStatus(editingStatus) === 'Resuelto' ? cleanText(finalResponse) : undefined
        })
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'No se pudo actualizar el estado del reclamo.'))
      }

      const updatedPayload = await response.json().catch(() => null)
      const updatedClaim = updatedPayload?.reclamo

      setClaims((current) =>
        current.map((claim) =>
          String(getClaimValue(claim, ['idReclamo', 'IdReclamo'])) === String(claimId)
            ? (updatedClaim || {
                ...claim,
                Estado: editingStatus,
                estado: editingStatus,
                RespuestaFinal: normalizeClaimStatus(editingStatus) === 'Resuelto' ? cleanText(finalResponse) : getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal'], ''),
                respuestaFinal: normalizeClaimStatus(editingStatus) === 'Resuelto' ? cleanText(finalResponse) : getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal'], ''),
                ...(nextStatusId ? { idEstadoReclamo: nextStatusId, IdEstadoReclamo: nextStatusId } : {})
              })
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

  const exportClaims = async (tipo) => {
    if (!filteredClaims.length) {
      setError('No hay reclamos para exportar con los filtros actuales.')
      return
    }

    try {
      setExporting(tipo)
      await exportTable({
        type: tipo,
        filename: 'reclamos',
        title: 'Listado de reclamos',
        columns: [
          { header: 'ID', value: (claim) => getClaimValue(claim, ['idReclamo', 'IdReclamo'], '-') },
          { header: 'Socio', value: (claim) => formatSocioName(getClaimValue(claim, ['Socio', 'NombreSocio'])) },
          {
            header: 'Documento',
            value: (claim) => formatDocumento(getClaimValue(claim, ['Documento', 'NroDocumento']), getClaimValue(claim, ['Socio']))
          },
          { header: 'Tipo', value: (claim) => formatTextValue(getClaimValue(claim, ['Tipo', 'TipoReclamo']), 'Sin tipo') },
          { header: 'Fecha', value: (claim) => safeFormatDate(getClaimValue(claim, ['Fecha', 'fecha'])) },
          { header: 'Estado', value: (claim) => normalizeClaimStatus(getClaimValue(claim, ['Estado', 'estado'])) },
          { header: 'Descripcion', value: (claim) => formatTextValue(getClaimValue(claim, ['Descripcion', 'descripcion']), 'Sin descripcion') },
          { header: 'Respuesta final', value: (claim) => formatTextValue(getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal']), 'Sin respuesta') },
          { header: 'Telefono', value: (claim) => resolvePhone(claim) || 'No informado' }
        ],
        rows: filteredClaims
      })
    } catch (exportError) {
      setError(exportError.message || 'No se pudo generar el archivo.')
    } finally {
      setExporting(null)
    }
  }

  const pagination = (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {paginatedClaims.length ? (currentPage - 1) * pageSize + 1 : 0}-
        {Math.min(currentPage * pageSize, filteredClaims.length)} de {filteredClaims.length}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(1)
          }}
          className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
          aria-label="Cantidad de reclamos por pagina"
        >
          <option value={10}>10 por pagina</option>
          <option value={25}>25 por pagina</option>
          <option value={50}>50 por pagina</option>
        </select>
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm font-medium text-gray-700">
          {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reclamos</h1>
          <p className="mt-1 text-gray-600">Consulta, filtra y gestiona reclamos sin recorrer listados largos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportClaims('PDF')}
            disabled={Boolean(exporting)}
            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            {exporting === 'PDF' ? 'Generando...' : 'PDF'}
          </button>
          <button
            type="button"
            onClick={() => exportClaims('Excel')}
            disabled={Boolean(exporting)}
            className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            {exporting === 'Excel' ? 'Generando...' : 'Excel'}
          </button>
          <button
            type="button"
            onClick={() => exportClaims('PSV')}
            disabled={Boolean(exporting)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Table className="mr-1.5 h-4 w-4" />
            {exporting === 'PSV' ? 'Generando...' : 'PSV'}
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
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
        <div className="grid gap-3 border-b border-gray-100 px-4 py-4 lg:grid-cols-[minmax(240px,1fr)_220px_auto] lg:items-center">
            <label className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar por socio, documento, tipo o descripcion..."
                className="w-full min-w-0 text-sm outline-none"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => resetToFirstPage(() => setStatusFilter(event.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {normalizedStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'Todos' ? 'Todos los estados' : status}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">
              {loading ? 'Cargando reclamos...' : `${filteredClaims.length} resultado${filteredClaims.length === 1 ? '' : 's'}`}
            </p>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-gray-500">Cargando reclamos...</div>
        ) : null}

        {!loading && error ? (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading ? pagination : null}

        {!loading ? (
          <div className="space-y-3 p-4 md:hidden">
            {paginatedClaims.map((claim, index) => (
              <div key={getClaimId(claim, index)} className="rounded-lg border border-gray-200 bg-white p-4">
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
                {getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal']) ? (
                  <div>
                    <p className="text-xs uppercase text-gray-500">Respuesta final</p>
                    <p className="text-sm text-gray-700">
                      {formatTextValue(getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal']), 'Sin respuesta')}
                    </p>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => openClaimManager(claim)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Gestionar
                </button>
                {resolvePhone(claim) ? (
                  <a
                    href={buildTelHref(resolvePhone(claim))}
                    className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
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
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Reclamo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClaims.map((claim, index) => (
                  <tr key={getClaimId(claim, index)} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{formatSocioName(getClaimValue(claim, ['Socio', 'NombreSocio']))}</p>
                      <p className="text-xs text-gray-500">
                        Doc. {formatDocumento(getClaimValue(claim, ['Documento', 'NroDocumento']), getClaimValue(claim, ['Socio']))}
                      </p>
                      <p className="text-xs text-gray-500">{resolvePhone(claim) || 'Sin telefono'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">#{getClaimValue(claim, ['idReclamo', 'IdReclamo'], '-')}</p>
                      <p className="text-sm text-gray-700">{formatTextValue(getClaimValue(claim, ['Tipo', 'TipoReclamo']), 'Sin tipo')}</p>
                      <p className="line-clamp-2 max-w-xl text-xs text-gray-500">
                        {formatTextValue(getClaimValue(claim, ['Descripcion', 'descripcion']), 'Sin descripcion')}
                      </p>
                      {getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal']) ? (
                        <p className="line-clamp-2 max-w-xl text-xs text-emerald-700">
                          Respuesta final: {formatTextValue(getClaimValue(claim, ['RespuestaFinal', 'respuestaFinal']))}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(
                          getClaimValue(claim, ['Estado', 'estado'])
                        )}`}
                      >
                      {normalizeClaimStatus(formatTextValue(getClaimValue(claim, ['Estado', 'estado']), 'Sin estado'))}
                    </span>
                  </td>
                    <td className="px-4 py-3">{safeFormatDate(getClaimValue(claim, ['Fecha', 'fecha']))}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
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

        {!loading ? pagination : null}
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

              {getClaimValue(selectedClaim, ['RespuestaFinal', 'respuestaFinal']) ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase text-emerald-700">Respuesta final registrada</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    {formatTextValue(getClaimValue(selectedClaim, ['RespuestaFinal', 'respuestaFinal']))}
                  </p>
                </div>
              ) : null}

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

              {normalizeClaimStatus(editingStatus) === 'Resuelto' ? (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Respuesta final</label>
                  <textarea
                    value={finalResponse}
                    onChange={(event) => setFinalResponse(event.target.value)}
                    minLength={FIELD_LIMITS.rejectionReason.min}
                    maxLength={500}
                    className="input-field min-h-28"
                    placeholder="Indica la solucion aplicada o la respuesta final para el socio"
                    disabled={savingStatus}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {cleanText(finalResponse).length}/500 caracteres. Minimo {FIELD_LIMITS.rejectionReason.min}.
                  </p>
                </div>
              ) : null}
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
