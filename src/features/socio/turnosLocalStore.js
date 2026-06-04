const STORAGE_KEY = 'turnosLocales'

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

export function obtenerTurnosLocales() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function guardarTurnoLocal(turno) {
  const turnos = obtenerTurnosLocales()
  const idSocio = pickFirst(turno.idSocio, turno.IdSocio, turno.idsocio, '')
  const socio =
    pickFirst(turno.socio, turno.Socio, turno.socioNombre, turno.SocioNombre, localStorage.getItem('nombre')) ||
    `Socio ${idSocio}`.trim()

  const nuevoTurno = {
    id: Date.now(),
    idSocio,
    socio,
    documentoSocio: pickFirst(
      turno.documentoSocio,
      turno.DocumentoSocio,
      turno.socioDocumento,
      turno.SocioDocumento,
      localStorage.getItem('usuario'),
      ''
    ),
    fecha: turno.fecha || turno.Fecha,
    hora: turno.hora || turno.Hora,
    motivo: turno.motivo || turno.Motivo,
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString(),
    observacionAdmin: '',
    origen: 'local'
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify([nuevoTurno, ...turnos]))
  return nuevoTurno
}

export function actualizarTurnoLocal(id, estado, cambios = {}) {
  const turnos = obtenerTurnosLocales()
  const actualizados = turnos.map((turno) =>
    Number(turno.id) === Number(id) ? { ...turno, ...cambios, estado } : turno
  )

  localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados))
  return actualizados
}

export function aceptarPropuestaTurnoLocal(id) {
  const turnos = obtenerTurnosLocales()
  const actualizados = turnos.map((turno) => {
    if (Number(turno.id) !== Number(id)) return turno

    return {
      ...turno,
      fecha: turno.fechaPropuesta || turno.fecha,
      hora: turno.horaPropuesta || turno.hora,
      estado: 'Aceptado'
    }
  })

  localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados))
  return actualizados
}

export function eliminarTurnoLocal(id) {
  const turnos = obtenerTurnosLocales()
  const actualizados = turnos.filter((turno) => Number(turno.id) !== Number(id))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados))
  return actualizados
}
