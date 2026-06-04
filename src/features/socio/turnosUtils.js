export const TURNOS_TIME_SLOTS = [
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

export const DEFAULT_AVAILABILITY_DAYS = 12

const CLOSED_STATUS_KEYS = new Set(['rechazado', 'rechazada', 'cancelado', 'cancelada'])

export function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

export function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(dateString) {
  const normalized = String(dateString || '').slice(0, 10)
  const [year, month, day] = normalized
    .split('-')
    .map(Number)

  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function isWeekend(dateString) {
  const date = typeof dateString === 'string' ? parseLocalDate(dateString) : dateString
  if (!date) return false
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isPastDate(dateString) {
  const date = parseLocalDate(dateString)
  if (!date) return true
  return date < startOfToday()
}

export function isPastSlot(dateString, timeString) {
  const date = parseLocalDate(dateString)
  if (!date || !timeString) return true

  const now = new Date()
  const todayKey = formatDateInput(now)
  const dateKey = formatDateInput(date)

  if (dateKey < todayKey) return true
  if (dateKey > todayKey) return false

  const [hours, minutes] = String(timeString).split(':').map(Number)
  const slotMinutes = hours * 60 + minutes
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return slotMinutes <= currentMinutes
}

export function formatDateLabel(dateString, options = {}) {
  const date = parseLocalDate(dateString)
  if (!date) return dateString || '-'

  return new Intl.DateTimeFormat('es-AR', {
    weekday: options.weekday || 'short',
    day: '2-digit',
    month: options.month || 'short'
  }).format(date)
}

export function formatDateLong(dateString) {
  const date = parseLocalDate(dateString)
  if (!date) return dateString || '-'

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function normalizeTurno(turno) {
  const fecha = pickFirst(turno?.fecha, turno?.Fecha, turno?.fechaSolicitada, turno?.FechaSolicitada, '')
  const hora = pickFirst(turno?.hora, turno?.Hora, '')
  const fechaPropuesta = pickFirst(turno?.fechaPropuesta, turno?.FechaPropuesta, '')
  const horaPropuesta = pickFirst(turno?.horaPropuesta, turno?.HoraPropuesta, '')
  const estado = pickFirst(turno?.estado, turno?.Estado, turno?.estadoTurno, turno?.EstadoTurno, 'Pendiente')

  return {
    id: pickFirst(turno?.id, turno?.idTurno, turno?.IdTurno),
    idSocio: pickFirst(turno?.idSocio, turno?.IdSocio, turno?.idsocio, ''),
    socio: pickFirst(
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
    documentoSocio: pickFirst(
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
    motivo: pickFirst(turno?.motivo, turno?.Motivo, ''),
    estado,
    observacionAdmin: pickFirst(turno?.observacionAdmin, turno?.ObservacionAdmin, ''),
    fechaCreacion: pickFirst(turno?.fechaCreacion, turno?.FechaCreacion, turno?.createdAt, ''),
    origen: turno?.origen
  }
}

export function isClosedTurno(turno) {
  return CLOSED_STATUS_KEYS.has(normalizeText(turno?.estado ?? turno?.Estado))
}

export function normalizeAvailability(data) {
  return ensureArray(data)
    .map((day) => {
      const fecha = pickFirst(day?.fecha, day?.Fecha, day?.date, day?.Date, '')
      const rawSlots = ensureArray(pickFirst(day?.horarios, day?.Horarios, day?.slots, day?.Slots, []))
      const horarios = rawSlots
        .map((slot) => (typeof slot === 'string' ? slot : pickFirst(slot?.hora, slot?.Hora, slot?.time, slot?.Time, '')))
        .filter((slot) => TURNOS_TIME_SLOTS.includes(slot) && !isPastSlot(fecha, slot))

      return {
        fecha,
        disponible: horarios.length > 0,
        horarios: [...new Set(horarios)]
      }
    })
    .filter((day) => day.fecha && !isPastDate(day.fecha) && !isWeekend(day.fecha))
}

export function buildLocalAvailability({ turnos = [], days = DEFAULT_AVAILABILITY_DAYS } = {}) {
  const blockedByDate = new Map()

  ensureArray(turnos)
    .map(normalizeTurno)
    .filter((turno) => !isClosedTurno(turno))
    .forEach((turno) => {
      const entries = [
        [turno.fecha, turno.hora],
        [turno.fechaPropuesta, turno.horaPropuesta]
      ]

      entries.forEach(([fecha, hora]) => {
        if (!fecha || !hora) return
        if (!blockedByDate.has(fecha)) blockedByDate.set(fecha, new Set())
        blockedByDate.get(fecha).add(hora)
      })
    })

  const result = []
  const cursor = startOfToday()
  let guard = 0

  while (result.length < days && guard < days * 4) {
    const fecha = formatDateInput(cursor)

    if (!isWeekend(cursor)) {
      const blockedSlots = blockedByDate.get(fecha) || new Set()
      const horarios = TURNOS_TIME_SLOTS.filter(
        (slot) => !blockedSlots.has(slot) && !isPastSlot(fecha, slot)
      )

      result.push({
        fecha,
        disponible: horarios.length > 0,
        horarios
      })
    }

    cursor.setDate(cursor.getDate() + 1)
    guard += 1
  }

  return result
}

export function compareTurnos(a, b) {
  const left = normalizeTurno(a)
  const right = normalizeTurno(b)
  const leftDate = `${left.fecha || '9999-12-31'} ${left.hora || '99:99'}`
  const rightDate = `${right.fecha || '9999-12-31'} ${right.hora || '99:99'}`
  return leftDate.localeCompare(rightDate)
}

export function statusStyles(status) {
  const normalized = normalizeText(status)

  if (normalized === 'aprobado' || normalized === 'aprobada' || normalized === 'aceptado' || normalized === 'aceptada') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (normalized === 'propuesto' || normalized === 'propuesta') {
    return 'bg-blue-100 text-blue-700'
  }

  if (normalized === 'rechazado' || normalized === 'rechazada' || normalized === 'cancelado' || normalized === 'cancelada') {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-amber-100 text-amber-700'
}
