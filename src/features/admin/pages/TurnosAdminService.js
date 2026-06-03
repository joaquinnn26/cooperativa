import { apiUrl } from '@/config/api.js'
import {
  actualizarTurnoLocal,
  obtenerTurnosLocales
} from '@/features/socio/turnosLocalStore.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

function normalizarTurno(turno) {
  return {
    id: turno.id ?? turno.idTurno ?? turno.IdTurno,
    socio: turno.socio ?? turno.Socio ?? turno.nombreSocio ?? turno.NombreSocio ?? turno.usuario ?? '',
    fecha: turno.fecha ?? turno.Fecha ?? '',
    hora: turno.hora ?? turno.Hora ?? '',
    fechaPropuesta: turno.fechaPropuesta ?? turno.FechaPropuesta ?? '',
    horaPropuesta: turno.horaPropuesta ?? turno.HoraPropuesta ?? '',
    motivo: turno.motivo ?? turno.Motivo ?? '',
    estado: turno.estado ?? turno.Estado ?? turno.estadoTurno ?? turno.EstadoTurno ?? 'Pendiente',
    origen: turno.origen
  }
}

export const obtenerTodosLosTurnos = async () => {
  const turnosLocales = obtenerTurnosLocales()

  const response = await fetch(apiUrl('/admin/turnos'), {
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (turnosLocales.length) return turnosLocales.map(normalizarTurno)
    throw new Error(errorText || 'No se pudieron obtener los turnos')
  }

  const turnosBackend = response.status === 204 ? [] : await response.json()
  return [...turnosBackend.map(normalizarTurno), ...turnosLocales.map(normalizarTurno)]
}

export const actualizarEstadoTurno = async (id, nuevoEstadoId, cambios = {}) => {
  const estadoLocal = nuevoEstadoId === 2 ? 'Aprobado' : cambios.estado || 'Propuesto'
  const esTurnoLocal = obtenerTurnosLocales().some((turno) => Number(turno.id) === Number(id))

  if (esTurnoLocal) {
    actualizarTurnoLocal(id, estadoLocal, cambios)
    return null
  }

  const response = await fetch(apiUrl(`/admin/turnos/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estadoId: nuevoEstadoId,
      ...cambios
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'No se pudo actualizar el turno')
  }

  return response.status === 204 ? null : response.json()
}
