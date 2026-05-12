export const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:58234'
export const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/api'

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_SERVER_URL}${API_BASE_PATH}${normalizedPath}`
}
