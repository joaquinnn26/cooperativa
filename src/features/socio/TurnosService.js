import { apiUrl } from '@/config/api.js'
import {
  buildLocalAvailability,
  DEFAULT_AVAILABILITY_DAYS,
  ensureArray,
  formatDateInput,
  normalizeAvailability,
  normalizeTurno
} from './turnosUtils.js'
import {
  aceptarPropuestaTurnoLocal,
  guardarTurnoLocal,
  obtenerTurnosLocales
} from './turnosLocalStore.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function readError(response, fallbackMessage) {
  const errorText = await response.text()
  try {
    const data = JSON.parse(errorText)
    return data?.message || data?.Message || errorText || fallbackMessage
  } catch {
    return errorText || fallbackMessage
  }
}

function isNetworkError(error) {
  return error instanceof TypeError || /failed to fetch|network|load failed/i.test(String(error?.message || ''))
}

function mergeLocalTurnos(remoteTurnos = [], idSocio = null) {
  const localTurnos = obtenerTurnosLocales().filter((turno) => {
    if (idSocio == null) return true
    return String(turno.idSocio || '') === String(idSocio)
  })

  return [...ensureArray(remoteTurnos), ...localTurnos].map(normalizeTurno)
}

export const obtenerDisponibilidadTurnos = async ({ desde, dias = DEFAULT_AVAILABILITY_DAYS, turnosBase = [] } = {}) => {
  const fechaDesde = desde || formatDateInput(new Date())

  try {
    const response = await fetch(apiUrl(`/turnos/disponibilidad?desde=${fechaDesde}&dias=${dias}`), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (response.ok) {
      const data = response.status === 204 ? [] : await response.json()
      const normalized = normalizeAvailability(data)
      if (normalized.length) return normalized
    }
  } catch {}

  return buildLocalAvailability({
    turnos: [...ensureArray(turnosBase), ...obtenerTurnosLocales()],
    days: dias
  })
}

export const crearTurno = async (datosTurno) => {
  try {
    const response = await fetch(apiUrl('/turnos'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datosTurno)
    })

    if (!response.ok) {
      throw new Error(await readError(response, 'No se pudo crear el turno'))
    }

    const data = response.status === 204 ? datosTurno : await response.json()
    return normalizeTurno(data)
  } catch (error) {
    if (!isNetworkError(error)) throw error
    return normalizeTurno(guardarTurnoLocal(datosTurno))
  }
}

export const obtenerTurnosPorSocio = async (idSocio) => {
  try {
    const response = await fetch(apiUrl(`/turnos/socio/${idSocio}`), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(await readError(response, 'Error al obtener los turnos del socio'))
    }

    const data = response.status === 204 ? [] : await response.json()
    return mergeLocalTurnos(data, idSocio)
  } catch (error) {
    if (!isNetworkError(error)) throw error
    return mergeLocalTurnos([], idSocio)
  }
}

export const aceptarPropuestaBackend = async (idTurno) => {
  const esTurnoLocal = obtenerTurnosLocales().some((turno) => String(turno.id) === String(idTurno))

  if (esTurnoLocal) {
    const actualizados = aceptarPropuestaTurnoLocal(idTurno)
    return actualizados.find((turno) => String(turno.id) === String(idTurno)) || null
  }

  const response = await fetch(apiUrl(`/turnos/${idTurno}/aceptar-propuesta`), {
    method: 'PUT',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo aceptar la propuesta'))
  }

  const data = response.status === 204 ? null : await response.json()
  return data ? normalizeTurno(data) : null
}
