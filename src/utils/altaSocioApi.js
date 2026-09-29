import { apiUrl } from '@/config/api.js'
import { territoryRequest } from './territory.js'

export function altaSocioApi(path = '', options = {}) {
  return territoryRequest(apiUrl(`/alta-socio${path}`), { token: localStorage.getItem('token'), ...options })
}

export async function obtenerVistaDocumentoAlta(documento, signal) {
  const response = await fetch(apiUrl(`/alta-socio/documentos/${documento.idDocumento}`), {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    cache: 'no-store',
    signal
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('No tenés autorización para visualizar este documento. Verificá tu sesión.')
    }
    throw new Error('No se pudo cargar la vista previa. Podés reintentar o descargar el documento.')
  }
  const archivo = await response.blob()
  const tipo = archivo.type.split(';')[0].trim().toLowerCase()
  if (!['image/png', 'image/jpeg', 'application/pdf'].includes(tipo)) {
    throw new Error('Este formato no admite vista previa. Usá la opción Descargar.')
  }
  return { archivo, tipo }
}

export async function descargarDocumentoAlta(documento) {
  const response = await fetch(apiUrl(`/alta-socio/documentos/${documento.idDocumento}`), {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  if (!response.ok) throw new Error('No se pudo descargar el documento.')
  const url = URL.createObjectURL(await response.blob())
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = documento.Nombre
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
