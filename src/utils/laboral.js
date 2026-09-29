import { apiUrl } from '../config/api.js'
import { territoryRequest } from './territory.js'
export function laboralApi(path = '', options = {}) {
  return territoryRequest(apiUrl(`/laboral${path}`), { token: localStorage.getItem('token'), ...options, ...(options.body && typeof options.body !== 'string' ? { body: JSON.stringify(options.body) } : {}) })
}
export function apiLaboralExistente(path, options = {}) {
  return territoryRequest(apiUrl(path), { token: localStorage.getItem('token'), ...options, ...(options.body && typeof options.body !== 'string' ? { body: JSON.stringify(options.body) } : {}) })
}
export async function archivoPayload(file) {
  if (!file || file.size > 2 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Elegí un PDF, PNG o JPEG de hasta 2 MB.')
  const Base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsDataURL(file) })
  return { Nombre: file.name, Tipo: file.type, Base64 }
}
export async function descargarLaboral(path, nombre) {
  const response = await fetch(apiUrl(`/laboral${path}`), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
  if (!response.ok) throw new Error('No se pudo descargar el archivo o no tenés permiso para verlo.')
  const url = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = url; a.download = nombre; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const tareaEstados = { PendienteAsignacion: 'Por asignar', Asignada: 'Asignada', EnCurso: 'En curso', EnRevision: 'Para revisar', Observada: 'Para corregir', Aprobada: 'Aprobada, pendiente de cierre', Rechazada: 'Rechazada', Cerrada: 'Cerrada' }
