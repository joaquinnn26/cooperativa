export class AvisosError extends Error {
  constructor(message, status = 0) { super(message); this.status = status }
}

function validarAviso(item) {
  if (!item || !Number.isSafeInteger(item.idAviso) || item.idAviso <= 0 ||
      item.Ambito !== 'Personal' || typeof item.Titulo !== 'string' ||
      typeof item.Mensaje !== 'string' || typeof item.TipoOrigen !== 'string' ||
      typeof item.idOrigen !== 'string' || ![1, 2, 3].includes(item.Prioridad) ||
      !Number.isFinite(Date.parse(item.FechaCreacionUtc)) ||
      ![item.FechaLecturaUtc, item.FechaArchivoUtc].every(value => value === null ||
        (typeof value === 'string' && Number.isFinite(Date.parse(value))))) {
    throw new AvisosError('La API devolvió un aviso que no se puede mostrar de forma segura.')
  }
  return item
}

export function createAvisosApi({ url, token, fetchImpl = globalThis.fetch }) {
  async function request(path, { signal, method = 'GET', individual = false } = {}) {
    if (!token) throw new AvisosError('Iniciá sesión para consultar tus avisos.', 401)
    const response = await fetchImpl(url(`/avisos${path}`), {
      method, signal, cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    if (!response.ok) {
      const messages = {
        401: 'Tu sesión no está disponible. Volvé a iniciar sesión.',
        403: 'Tu cuenta no tiene acceso a estos avisos.',
        404: individual
          ? 'El aviso ya no está disponible o no tenés acceso al trámite.'
          : 'La consulta de avisos no está disponible. Intentá nuevamente o contactá a la cooperativa.'
      }
      throw new AvisosError(messages[response.status] || 'No se pudieron consultar o actualizar los avisos. Intentá nuevamente.', response.status)
    }
    try { return await response.json() }
    catch { throw new AvisosError('La API devolvió una respuesta de avisos inválida.') }
  }
  return {
    async list({ pagina = 1, tamanoPagina = 5, incluirArchivados = false, signal } = {}) {
      const query = new URLSearchParams({ pagina, tamanoPagina, incluirArchivados })
      const data = await request(`?${query}`, { signal })
      if (!Array.isArray(data?.items) || !Number.isSafeInteger(data.total) || data.total < 0 ||
          data.pagina !== pagina || data.tamanoPagina !== tamanoPagina ||
          data.incluirArchivados !== incluirArchivados) {
        throw new AvisosError('La API devolvió una página de avisos inválida.')
      }
      return { ...data, items: data.items.map(validarAviso) }
    },
    async summary({ signal } = {}) {
      const data = await request('/resumen', { signal })
      if (!Number.isSafeInteger(data?.noLeidos) || data.noLeidos < 0) {
        throw new AvisosError('La API devolvió un contador de avisos inválido.')
      }
      return data.noLeidos
    },
    async mark(id, archived, { signal } = {}) {
      if (!Number.isSafeInteger(id) || id <= 0) throw new AvisosError('El aviso no es válido.')
      const item = validarAviso(await request(`/${id}/${archived ? 'archivado' : 'leido'}`, { method: 'PUT', signal, individual: true }))
      if (item.idAviso !== id) throw new AvisosError('La API devolvió un aviso diferente al solicitado.')
      return item
    }
  }
}
