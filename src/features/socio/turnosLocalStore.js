const STORAGE_KEY = 'turnosLocales'

export function obtenerTurnosLocales() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function guardarTurnoLocal(turno) {
  const turnos = obtenerTurnosLocales()
  const nuevoTurno = {
    id: Date.now(),
    socio: localStorage.getItem('usuario') || `Socio ${turno.idSocio ?? ''}`.trim(),
    fecha: turno.fecha || turno.Fecha,
    hora: turno.hora || turno.Hora,
    motivo: turno.motivo || turno.Motivo,
    estado: 'Pendiente',
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
