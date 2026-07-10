import { useMemo } from 'react'
import { apiUrl } from '@/config/api.js'
import {
  asegurarArray,
  compararTurnosRecientes,
  limpiarTextoPlano,
  normalizarTurno
} from '@/utils/turnosUtils.jsx'

const ESTADO_POR_ID = {
  1: 'Pendiente',
  2: 'Aprobado',
  3: 'Propuesto',
  4: 'Rechazado',
  5: 'Cancelado',
  6: 'Aceptado'
}

function obtenerHeadersAuth() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function leerError(respuesta, mensajeFallback) {
  const textoError = await respuesta.text()
  try {
    const datos = JSON.parse(textoError)
    return datos?.message || datos?.Message || textoError || mensajeFallback
  } catch {
    return textoError || mensajeFallback
  }
}

export const obtenerTodosLosTurnos = async () => {
  const respuesta = await fetch(apiUrl('/admin/turnos'), {
    headers: obtenerHeadersAuth()
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudieron obtener los turnos'))
  }

  const datos = respuesta.status === 204 ? [] : await respuesta.json()
  return asegurarArray(datos).map(normalizarTurno).sort(compararTurnosRecientes)
}

export const actualizarEstadoTurno = async (idTurno, nuevoEstadoId, cambios = {}) => {
  if (!idTurno) {
    throw new Error('No se pudo identificar el turno a actualizar.')
  }

  if (!ESTADO_POR_ID[nuevoEstadoId]) {
    throw new Error('El estado de turno seleccionado no es valido.')
  }

  const estadoLocal = ESTADO_POR_ID[nuevoEstadoId] || cambios.estado || 'Pendiente'
  const cuerpo = { ...cambios }

  if (cambios.observacionAdmin != null || cambios.ObservacionAdmin != null) {
    const observacion = limpiarTextoPlano(cambios.observacionAdmin || cambios.ObservacionAdmin)
    cuerpo.observacionAdmin = observacion
    cuerpo.ObservacionAdmin = observacion
  }

  if (cambios.motivoRechazo != null || cambios.MotivoRechazo != null) {
    const motivoRechazo = limpiarTextoPlano(cambios.motivoRechazo || cambios.MotivoRechazo)
    cuerpo.motivoRechazo = motivoRechazo
    cuerpo.MotivoRechazo = motivoRechazo
    cuerpo.observacionAdmin = motivoRechazo
    cuerpo.ObservacionAdmin = motivoRechazo
  }

  const respuesta = await fetch(apiUrl(`/admin/turnos/${idTurno}`), {
    method: 'PUT',
    headers: obtenerHeadersAuth(),
    body: JSON.stringify({
      estadoId: nuevoEstadoId,
      idEstadoTurno: nuevoEstadoId,
      IdEstadoTurno: nuevoEstadoId,
      ...cuerpo
    })
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudo actualizar el turno'))
  }

  const datos = respuesta.status === 204 ? { id: idTurno, estado: estadoLocal, ...cuerpo } : await respuesta.json()
  return normalizarTurno(datos)
}

export const eliminarTurnoAdmin = async (idTurno) => {
  if (!idTurno) {
    throw new Error('No se pudo identificar el turno a eliminar.')
  }

  const respuesta = await fetch(apiUrl(`/admin/turnos/${idTurno}`), {
    method: 'DELETE',
    headers: obtenerHeadersAuth()
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudo eliminar el turno'))
  }

  return true
}

export function useAdminTurnos() {
  return useMemo(
    () => ({
      obtenerTodosLosTurnos,
      actualizarEstadoTurno,
      eliminarTurnoAdmin
    }),
    []
  )
}
