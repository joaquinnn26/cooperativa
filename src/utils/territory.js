export function normalizeTerritoryName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function territoryPayload(form) {
  const Motivo = normalizeTerritoryName(form.Motivo)
  if (!Motivo || Motivo.length > 300) throw new Error('Indicá un motivo de hasta 300 caracteres.')
  if (form.kind === 'conexiones') {
    const Direccion = normalizeTerritoryName(form.Direccion)
    if (!Direccion || Direccion.length > 250) throw new Error('Indicá la dirección de esta conexión (hasta 250 caracteres).')
    const idBarrio = form.idBarrio ? Number(form.idBarrio) : null
    if (idBarrio != null && (!Number.isInteger(idBarrio) || idBarrio <= 0)) throw new Error('Barrio inválido.')
    const Localidad = normalizeTerritoryName(form.Localidad)
    if (!Localidad || Localidad.length > 100) throw new Error('Indicá la localidad o jurisdicción de la conexión.')
    const Ambito = form.Ambito
    if (!['Urbano', 'Rural'].includes(Ambito)) throw new Error('Seleccioná ámbito urbano o rural.')
    const Ruta = normalizeTerritoryName(form.Ruta)
    const Folio = normalizeTerritoryName(form.Folio)
    if (Ruta.length > 30 || Folio.length > 30 || Boolean(Ruta) !== Boolean(Folio)) throw new Error('Ruta y folio se cargan juntos, con hasta 30 caracteres cada uno.')
    return { Direccion, idBarrio, Localidad, Ambito, Ruta: Ruta || null, Folio: Folio || null, Motivo, Version: form.Version ?? null }
  }
  const Nombre = normalizeTerritoryName(form.Nombre)
  if (!Nombre || Nombre.length > 100) throw new Error('Indicá un nombre de hasta 100 caracteres.')
  const result = { Nombre, Activo: form.Activo, Motivo, Version: form.Version ?? null }
  if (form.kind === 'barrios') {
    const idZona = Number(form.idZona)
    if (!Number.isInteger(idZona) || idZona <= 0) throw new Error('Seleccioná una zona.')
    result.idZona = idZona
  }
  return result
}

export async function territoryRequest(url, { token, ...options } = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  })
  const raw = await response.text()
  let data
  try { data = raw ? JSON.parse(raw) : null } catch { data = null }
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.Message
    throw new Error(response.status >= 500
      ? message || 'No se pudo consultar o guardar la información. Reintentá; si continúa, contactá al administrador.'
      : message || (response.status === 404 ? 'La gestión territorial todavía no está disponible en la API.' : 'No se pudo completar la operación. Verificá tu sesión y reintentá.'))
  }
  if (data == null && response.status !== 204) throw new Error('La API devolvió una respuesta inesperada.')
  return data
}
