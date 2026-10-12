// The public query must never fall back to persisted administrative or demo data.
export async function fetchPublicAnnouncements(url, { signal, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, { signal, cache: 'no-store', credentials: 'omit' })
  if (!response.ok) throw new Error('No se pudieron cargar las novedades. Intentá nuevamente.')
  const data = await response.json()
  const items = Array.isArray(data) ? data : data?.$values
  if (!Array.isArray(items)) throw new Error('La respuesta de novedades no es válida.')
  return items.map(item => ({
    id: item.idAnuncio,
    title: item.Titulo || '',
    content: item.Contenido || '',
    date: item.FechaPublicacion,
    priority: item.Prioridad === 'Alta' ? 'high' : item.Prioridad === 'Baja' ? 'low' : 'medium',
    fixed: Boolean(item.Fijo)
  }))
}
