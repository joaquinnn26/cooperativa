import { apiUrl } from '@/config/api.js'
import {
  actualizarTurnoLocal,
  obtenerTurnosLocales
} from '@/features/socio/turnosLocalStore.js'
import {
  compareTurnos,
  ensureArray,
  normalizeTurno
} from '@/features/socio/turnosUtils.js'

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

function isNetworkError(error) {
  return error instanceof TypeError || /failed to fetch|network|load failed/i.test(String(error?.message || ''))
}

function mergeTurnos(remoteTurnos = []) {
  return [...ensureArray(remoteTurnos), ...obtenerTurnosLocales()]
    .map(normalizeTurno)
    .sort(compareTurnos)
}

export const obtenerTodosLosTurnos = async () => {
  try {
    const response = await fetch(apiUrl('/admin/turnos'), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(await readError(response, 'No se pudieron obtener los turnos'))
    }

    const data = response.status === 204 ? [] : await response.json()
    return mergeTurnos(data)
  } catch (error) {
    if (!isNetworkError(error)) throw error
    return mergeTurnos([])
  }
}

export const actualizarEstadoTurno = async (id, nuevoEstadoId, cambios = {}) => {
  const estadoLocal = ESTADO_POR_ID[nuevoEstadoId] || cambios.estado || 'Pendiente'
  const esTurnoLocal = obtenerTurnosLocales().some((turno) => String(turno.id) === String(id))

  if (esTurnoLocal) {
    const actualizados = actualizarTurnoLocal(id, estadoLocal, {
      ...cambios,
      estado: estadoLocal
    })
    return normalizeTurno(actualizados.find((turno) => String(turno.id) === String(id)))
  }

  const response = await fetch(apiUrl(`/admin/turnos/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estadoId: nuevoEstadoId,
      idEstadoTurno: nuevoEstadoId,
      IdEstadoTurno: nuevoEstadoId,
      ...cambios
    })
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo actualizar el turno'))
  }

  const data = response.status === 204 ? { id, estado: estadoLocal, ...cambios } : await response.json()
  return normalizeTurno(data)
}
