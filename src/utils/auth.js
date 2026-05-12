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

export function getDefaultRouteByRole(role) {
  return role === 'Admin' ? '/admin' : '/socio'
}
