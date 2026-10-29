const configuredServerUrl = import.meta.env.VITE_API_SERVER_URL
const defaultServerUrl = import.meta.env.PROD
  ? 'https://cospral.runasp.net'
  : 'http://localhost:58234'

// Una URL vacía permite servir React y la API desde el mismo sitio publicado.
export const API_SERVER_URL = configuredServerUrl === ''
  ? window.location.origin
  : (configuredServerUrl || defaultServerUrl).replace(/\/+$/, '')
export const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/api'

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_SERVER_URL}${API_BASE_PATH}${normalizedPath}`
}
