import { apiUrl } from '@/config/api.js'
import { territoryRequest } from './territory.js'

export function altaSocioApi(path = '', options = {}) {
  return territoryRequest(apiUrl(`/alta-socio${path}`), { token: localStorage.getItem('token'), ...options })
}

export async function descargarDocumentoAlta(documento) {
  const response = await fetch(apiUrl(`/alta-socio/documentos/${documento.idDocumento}`), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, cache: 'no-store' })
  if (!response.ok) throw new Error('No se pudo abrir el documento o no tenés permiso para verlo.')
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = documento.Nombre || 'documento'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
