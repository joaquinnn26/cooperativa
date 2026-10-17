export function puedeConsultarAvisos(session) {
  return Boolean(session.token && session.sessionStatus === 'authenticated' &&
    session.rol === 'Socio' && session.idSocio &&
    (!session.altaSocio?.Estado || session.altaSocio.Estado === 'Aprobada'))
}

export function destinoAviso(aviso) {
  // MisTurnos currently has no route for the detail of an individual appointment.
  return aviso.Ambito === 'Personal' && aviso.TipoOrigen === 'Turno' &&
    /^\d+$/.test(String(aviso.idOrigen)) ? '/socio/turnos' : null
}

export function fechaAviso(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es-AR', {
    dateStyle: 'short', timeStyle: 'short'
  })
}

export const prioridadesAviso = { 1: 'Alta', 2: 'Media', 3: 'Baja' }
