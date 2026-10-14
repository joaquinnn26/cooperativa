export function uniqueActiveConnections(items) {
  return [...new Map((items || []).filter(item => item.Activo && Number(item.idServicioSocio) > 0).map(item => [String(item.idServicioSocio), item])).values()]
}

export function workTaskPayload(area, title, mode, connection) {
  const text = title.trim()
  if (text.length < 5 || text.length > 200) throw new Error('Describí el trabajo con entre 5 y 200 caracteres.')
  if (!['internal', 'connection'].includes(mode)) throw new Error('Elegí dónde se realizará el trabajo.')
  if (mode === 'connection' && (!connection?.Activo || !Number.isInteger(Number(connection.idServicioSocio)) || Number(connection.idServicioSocio) <= 0)) throw new Error('Seleccioná una conexión activa para este trabajo.')
  return { Area: area, Categoria: 'Trabajo', Titulo: text, idServicioSocio: mode === 'connection' ? Number(connection.idServicioSocio) : null }
}
