const CLAIM_STATUS_IDS = {
  Pendiente: 1,
  'En proceso': 2,
  Resuelto: 3,
  Cancelado: 4
}

const CLAIM_TRANSITIONS = {
  Pendiente: ['En proceso', 'Cancelado'],
  'En proceso': ['Resuelto', 'Cancelado'],
  Resuelto: [],
  Cancelado: []
}

export function normalizeClaimStatus(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value.includes('cancel')) return 'Cancelado'
  if (value.includes('resuelto')) return 'Resuelto'
  if (value.includes('proceso')) return 'En proceso'
  if (value.includes('pend')) return 'Pendiente'
  return status || 'Sin estado'
}

export function getClaimStatusId(status) {
  return CLAIM_STATUS_IDS[normalizeClaimStatus(status)] ?? null
}

export function getAllowedClaimStatuses(currentStatus) {
  const normalized = normalizeClaimStatus(currentStatus)
  return [normalized, ...(CLAIM_TRANSITIONS[normalized] || [])]
}

export function isValidClaimTransition(currentStatus, nextStatus) {
  const current = normalizeClaimStatus(currentStatus)
  const next = normalizeClaimStatus(nextStatus)
  return current === next || (CLAIM_TRANSITIONS[current] || []).includes(next)
}

export const CLAIM_STATUS_OPTIONS = Object.entries(CLAIM_STATUS_IDS).map(([NombreEstado, idEstadoReclamo]) => ({
  idEstadoReclamo,
  NombreEstado
}))
