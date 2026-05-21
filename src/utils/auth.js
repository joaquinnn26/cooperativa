export function parseJwt(token) {
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = atob(padded)

    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function getTokenExpiration(token) {
  const payload = parseJwt(token)
  if (!payload?.exp) return null
  return payload.exp * 1000
}

export function isTokenExpired(token) {
  const expiresAt = getTokenExpiration(token)
  if (!expiresAt) return true
  return Date.now() >= expiresAt
}

export function hasActiveSession({ token, usuario }) {
  if (token) return !isTokenExpired(token)
  return Boolean(usuario)
}

export function normalizeRole(role) {
  if (!role) return null
  const value = String(role).trim().toLowerCase()
  if (value === 'admin' || value === 'administrador') return 'Administrador'
  if (value === 'empleado') return 'Empleado'
  if (value === 'socio') return 'Socio'
  return String(role).trim()
}

export function normalizeCargo(cargo) {
  return String(cargo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function cargoMatches(cargo, expectedCargo) {
  return normalizeCargo(cargo).includes(normalizeCargo(expectedCargo))
}

export function rolesMatch(actualRole, expectedRole) {
  return normalizeRole(actualRole) === normalizeRole(expectedRole)
}

export function getDefaultRouteByRole(role) {
  const normalizedRole = normalizeRole(role)
  if (normalizedRole === 'Administrador') return '/admin'
  if (normalizedRole === 'Empleado') return '/empleado'
  return '/socio'
}
