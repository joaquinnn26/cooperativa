export const HORARIOS_TURNOS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30'
]

export const DIAS_DISPONIBILIDAD_TURNOS = 12
export const MINIMO_CARACTERES_MOTIVO_TURNO = 10
export const MAXIMO_CARACTERES_MOTIVO_TURNO = 300

export function asegurarArray(datos) {
  if (Array.isArray(datos)) return datos
  if (Array.isArray(datos?.$values)) return datos.$values
  if (Array.isArray(datos?.data)) return datos.data
  if (Array.isArray(datos?.items)) return datos.items
  if (Array.isArray(datos?.results)) return datos.results
  return []
}

export function obtenerPrimerValor(...valores) {
  return valores.find((valor) => valor !== undefined && valor !== null && String(valor).trim() !== '')
}

export function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function limpiarTextoPlano(valor) {
  return String(valor || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validarSolicitudTurno({ fecha, hora, motivoDetalle, maxLength = MAXIMO_CARACTERES_MOTIVO_TURNO }) {
  if (!fecha) return 'Selecciona un dia disponible.'
  if (!hora) return 'Selecciona un horario disponible.'
  if (!HORARIOS_TURNOS.includes(hora)) return 'El horario seleccionado no pertenece a la agenda permitida.'
  if (esFechaPasada(fecha) || esHorarioPasado(fecha, hora)) return 'El turno no puede quedar en una fecha u horario pasado.'
  if (esFinDeSemana(fecha)) return 'Los turnos presenciales solo se toman de lunes a viernes.'

  const detalle = limpiarTextoPlano(motivoDetalle)
  if (detalle.length < MINIMO_CARACTERES_MOTIVO_TURNO) {
    return `El detalle debe tener al menos ${MINIMO_CARACTERES_MOTIVO_TURNO} caracteres.`
  }
  if (detalle.length > maxLength) {
    return `El detalle no puede superar ${maxLength} caracteres.`
  }

  return ''
}

export function formatearFechaInput(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function parsearFechaLocal(fechaTexto) {
  const fechaNormalizada = String(fechaTexto || '').slice(0, 10)
  const [anio, mes, dia] = fechaNormalizada
    .split('-')
    .map(Number)

  if (!anio || !mes || !dia) return null
  return new Date(anio, mes - 1, dia)
}

function inicioDelDiaActual() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy
}

export function esFinDeSemana(fechaTexto) {
  const fecha = typeof fechaTexto === 'string' ? parsearFechaLocal(fechaTexto) : fechaTexto
  if (!fecha) return false
  const dia = fecha.getDay()
  return dia === 0 || dia === 6
}

export function esFechaPasada(fechaTexto) {
  const fecha = parsearFechaLocal(fechaTexto)
  if (!fecha) return true
  return fecha < inicioDelDiaActual()
}

export function esHorarioPasado(fechaTexto, horaTexto) {
  const fecha = parsearFechaLocal(fechaTexto)
  if (!fecha || !horaTexto) return true

  const ahora = new Date()
  const claveHoy = formatearFechaInput(ahora)
  const claveFecha = formatearFechaInput(fecha)

  if (claveFecha < claveHoy) return true
  if (claveFecha > claveHoy) return false

  const [horas, minutos] = String(horaTexto).split(':').map(Number)
  const minutosHorario = horas * 60 + minutos
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes()
  return minutosHorario <= minutosActuales
}

export function formatearFechaCorta(fechaTexto, opciones = {}) {
  const fecha = parsearFechaLocal(fechaTexto)
  if (!fecha) return fechaTexto || '-'

  return new Intl.DateTimeFormat('es-AR', {
    weekday: opciones.weekday || 'short',
    day: '2-digit',
    month: opciones.month || 'short'
  }).format(fecha)
}

export function formatearFechaLarga(fechaTexto) {
  const fecha = parsearFechaLocal(fechaTexto)
  if (!fecha) return fechaTexto || '-'

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(fecha)
}

export function normalizarTurno(turno) {
  const fecha = obtenerPrimerValor(turno?.fecha, turno?.Fecha, turno?.fechaSolicitada, turno?.FechaSolicitada, '')
  const hora = obtenerPrimerValor(turno?.hora, turno?.Hora, '')
  const fechaPropuesta = obtenerPrimerValor(turno?.fechaPropuesta, turno?.FechaPropuesta, '')
  const horaPropuesta = obtenerPrimerValor(turno?.horaPropuesta, turno?.HoraPropuesta, '')
  const estado = obtenerPrimerValor(turno?.estado, turno?.Estado, turno?.estadoTurno, turno?.EstadoTurno, 'Pendiente')
  const observacionAdmin = obtenerPrimerValor(turno?.observacionAdmin, turno?.ObservacionAdmin, '')
  const motivoRechazo = obtenerPrimerValor(
    turno?.motivoRechazo,
    turno?.MotivoRechazo,
    normalizarTexto(estado).startsWith('rechazad') ? observacionAdmin : '',
    ''
  )

  return {
    id: obtenerPrimerValor(turno?.id, turno?.idTurno, turno?.IdTurno),
    idSocio: obtenerPrimerValor(turno?.idSocio, turno?.IdSocio, turno?.idsocio, ''),
    socio: obtenerPrimerValor(
      turno?.socio,
      turno?.Socio,
      turno?.socioNombre,
      turno?.SocioNombre,
      turno?.nombreSocio,
      turno?.NombreSocio,
      turno?.usuario,
      turno?.Usuario,
      turno?.Socio?.Persona?.Nombre && turno?.Socio?.Persona?.Apellido
        ? `${turno.Socio.Persona.Nombre} ${turno.Socio.Persona.Apellido}`
        : '',
      ''
    ),
    documentoSocio: obtenerPrimerValor(
      turno?.documentoSocio,
      turno?.DocumentoSocio,
      turno?.socioDocumento,
      turno?.SocioDocumento,
      turno?.usuarioSocio,
      turno?.UsuarioSocio,
      turno?.Socio?.Persona?.Documento,
      ''
    ),
    fecha,
    hora,
    fechaPropuesta,
    horaPropuesta,
    motivo: obtenerPrimerValor(turno?.motivo, turno?.Motivo, ''),
    estado,
    observacionAdmin,
    motivoRechazo,
    fechaCreacion: obtenerPrimerValor(turno?.fechaCreacion, turno?.FechaCreacion, turno?.createdAt, ''),
    origen: turno?.origen
  }
}

export function normalizarDisponibilidad(datos) {
  return asegurarArray(datos)
    .map((diaDisponible) => {
      const fecha = obtenerPrimerValor(diaDisponible?.fecha, diaDisponible?.Fecha, diaDisponible?.date, diaDisponible?.Date, '')
      const horariosSinNormalizar = asegurarArray(
        obtenerPrimerValor(diaDisponible?.horarios, diaDisponible?.Horarios, diaDisponible?.slots, diaDisponible?.Slots, [])
      )
      const horarios = horariosSinNormalizar
        .map((horario) =>
          typeof horario === 'string'
            ? horario
            : obtenerPrimerValor(horario?.hora, horario?.Hora, horario?.time, horario?.Time, '')
        )
        .filter((horario) => HORARIOS_TURNOS.includes(horario) && !esHorarioPasado(fecha, horario))

      return {
        fecha,
        disponible: horarios.length > 0,
        horarios: [...new Set(horarios)]
      }
    })
    .filter((diaDisponible) => diaDisponible.fecha && !esFechaPasada(diaDisponible.fecha) && !esFinDeSemana(diaDisponible.fecha))
}

export function compararTurnos(a, b) {
  const turnoIzquierdo = normalizarTurno(a)
  const turnoDerecho = normalizarTurno(b)
  const fechaIzquierda = `${turnoIzquierdo.fecha || '9999-12-31'} ${turnoIzquierdo.hora || '99:99'}`
  const fechaDerecha = `${turnoDerecho.fecha || '9999-12-31'} ${turnoDerecho.hora || '99:99'}`
  return fechaIzquierda.localeCompare(fechaDerecha)
}

export function compararTurnosRecientes(a, b) {
  const turnoIzquierdo = normalizarTurno(a)
  const turnoDerecho = normalizarTurno(b)
  const fechaIzquierda = `${turnoIzquierdo.fecha || '0000-00-00'} ${turnoIzquierdo.hora || '00:00'}`
  const fechaDerecha = `${turnoDerecho.fecha || '0000-00-00'} ${turnoDerecho.hora || '00:00'}`
  const comparacionFecha = fechaDerecha.localeCompare(fechaIzquierda)

  if (comparacionFecha !== 0) return comparacionFecha

  const creadoIzquierdo = String(turnoIzquierdo.fechaCreacion || '')
  const creadoDerecho = String(turnoDerecho.fechaCreacion || '')
  const comparacionCreacion = creadoDerecho.localeCompare(creadoIzquierdo)

  if (comparacionCreacion !== 0) return comparacionCreacion

  return Number(turnoDerecho.id || 0) - Number(turnoIzquierdo.id || 0)
}

export function estilosEstadoTurno(estado) {
  const estadoNormalizado = normalizarTexto(estado)

  if (estadoNormalizado.startsWith('aprobad') || estadoNormalizado.startsWith('aceptad')) {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (estadoNormalizado.startsWith('propuest')) {
    return 'bg-blue-100 text-blue-700'
  }

  if (estadoNormalizado.startsWith('rechazad') || estadoNormalizado.startsWith('cancelad')) {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-amber-100 text-amber-700'
}
