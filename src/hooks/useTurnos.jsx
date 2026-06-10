import { useMemo } from 'react'
import { apiUrl } from '@/config/api.js'
import {
  DEFAULT_AVAILABILITY_DAYS,
  ensureArray,
  formatDateInput,
  normalizeAvailability,
  normalizeTurno,
  sanitizePlainText,
  validateTurnoRequest
} from '@/utils/turnosUtils.jsx'

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

export const obtenerDisponibilidadTurnos = async ({ desde, dias = DEFAULT_AVAILABILITY_DAYS, turnosBase = [] } = {}) => {
  const fechaDesde = desde || formatDateInput(new Date())

  const response = await fetch(apiUrl(`/turnos/disponibilidad?desde=${fechaDesde}&dias=${dias}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo obtener la disponibilidad de turnos'))
  }

  const data = response.status === 204 ? [] : await response.json()
  return normalizeAvailability(data)
}

export const crearTurno = async (datosTurno) => {
  const fecha = datosTurno?.fecha || datosTurno?.Fecha
  const hora = datosTurno?.hora || datosTurno?.Hora
  const motivo = sanitizePlainText(datosTurno?.motivo || datosTurno?.Motivo)
  const validationError = validateTurnoRequest({ fecha, hora, motivoDetalle: motivo, maxLength: 500 })

  if (!datosTurno?.idSocio && !datosTurno?.IdSocio) {
    throw new Error('No se pudo identificar el socio del turno.')
  }

  if (validationError) {
    throw new Error(validationError)
  }

  const payload = {
    ...datosTurno,
    socioNombre: sanitizePlainText(datosTurno?.socioNombre || datosTurno?.SocioNombre),
    SocioNombre: sanitizePlainText(datosTurno?.SocioNombre || datosTurno?.socioNombre),
    socioDocumento: sanitizePlainText(datosTurno?.socioDocumento || datosTurno?.SocioDocumento),
    SocioDocumento: sanitizePlainText(datosTurno?.SocioDocumento || datosTurno?.socioDocumento),
    motivo,
    Motivo: motivo
  }

  const response = await fetch(apiUrl('/turnos'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo crear el turno'))
  }

  const data = response.status === 204 ? payload : await response.json()
  return normalizeTurno(data)
}

export const obtenerTurnosPorSocio = async (idSocio) => {
  if (!idSocio) {
    throw new Error('No se pudo identificar el socio para cargar sus turnos.')
  }

  const response = await fetch(apiUrl(`/turnos/socio/${idSocio}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'Error al obtener los turnos del socio'))
  }

  const data = response.status === 204 ? [] : await response.json()
  return ensureArray(data).map(normalizeTurno)
}

export const aceptarPropuestaBackend = async (idTurno) => {
  if (!idTurno) {
    throw new Error('No se pudo identificar el turno a confirmar.')
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

export function useTurnos() {
  return useMemo(
    () => ({
      obtenerDisponibilidadTurnos,
      crearTurno,
      obtenerTurnosPorSocio,
      aceptarPropuestaBackend
    }),
    []
  )
}
