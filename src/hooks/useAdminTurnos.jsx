import { useMemo } from 'react'
import { apiUrl } from '@/config/api.js'
import {
  compareTurnosRecientes,
  ensureArray,
  normalizeTurno,
  sanitizePlainText
} from '@/utils/turnosUtils.jsx'

const ESTADO_POR_ID = {
  1: 'Pendiente',
  2: 'Aprobado',
  3: 'Propuesto',
  4: 'Rechazado',
  5: 'Cancelado',
  6: 'Aceptado'
}

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

export const obtenerTodosLosTurnos = async () => {
  const response = await fetch(apiUrl('/admin/turnos'), {
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudieron obtener los turnos'))
  }

  const data = response.status === 204 ? [] : await response.json()
  return ensureArray(data).map(normalizeTurno).sort(compareTurnosRecientes)
}

export const actualizarEstadoTurno = async (id, nuevoEstadoId, cambios = {}) => {
  if (!id) {
    throw new Error('No se pudo identificar el turno a actualizar.')
  }

  if (!ESTADO_POR_ID[nuevoEstadoId]) {
    throw new Error('El estado de turno seleccionado no es valido.')
  }

  const estadoLocal = ESTADO_POR_ID[nuevoEstadoId] || cambios.estado || 'Pendiente'
  const payload = { ...cambios }

  if (cambios.observacionAdmin != null || cambios.ObservacionAdmin != null) {
    const observacion = sanitizePlainText(cambios.observacionAdmin || cambios.ObservacionAdmin)
    payload.observacionAdmin = observacion
    payload.ObservacionAdmin = observacion
  }

  const response = await fetch(apiUrl(`/admin/turnos/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estadoId: nuevoEstadoId,
      idEstadoTurno: nuevoEstadoId,
      IdEstadoTurno: nuevoEstadoId,
      ...payload
    })
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo actualizar el turno'))
  }

  const data = response.status === 204 ? { id, estado: estadoLocal, ...payload } : await response.json()
  return normalizeTurno(data)
}

export function useAdminTurnos() {
  return useMemo(
    () => ({
      obtenerTodosLosTurnos,
      actualizarEstadoTurno
    }),
    []
  )
}
