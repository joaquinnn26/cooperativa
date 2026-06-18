import { useMemo } from 'react'
import { apiUrl } from '@/config/api.js'
import {
  DIAS_DISPONIBILIDAD_TURNOS,
  asegurarArray,
  formatearFechaInput,
  limpiarTextoPlano,
  normalizarDisponibilidad,
  normalizarTurno,
  validarSolicitudTurno
} from '@/utils/turnosUtils.jsx'

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

export const obtenerDisponibilidadTurnos = async ({ desde, dias = DIAS_DISPONIBILIDAD_TURNOS } = {}) => {
  const fechaDesde = desde || formatearFechaInput(new Date())

  const respuesta = await fetch(apiUrl(`/turnos/disponibilidad?desde=${fechaDesde}&dias=${dias}`), {
    method: 'GET',
    headers: obtenerHeadersAuth()
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudo obtener la disponibilidad de turnos'))
  }

  const datos = respuesta.status === 204 ? [] : await respuesta.json()
  return normalizarDisponibilidad(datos)
}

export const crearTurno = async (datosTurno) => {
  const fecha = datosTurno?.fecha || datosTurno?.Fecha
  const hora = datosTurno?.hora || datosTurno?.Hora
  const motivo = limpiarTextoPlano(datosTurno?.motivo || datosTurno?.Motivo)
  const errorValidacion = validarSolicitudTurno({ fecha, hora, motivoDetalle: motivo, maxLength: 500 })

  if (!datosTurno?.idSocio && !datosTurno?.IdSocio) {
    throw new Error('No se pudo identificar el socio del turno.')
  }

  if (errorValidacion) {
    throw new Error(errorValidacion)
  }

  const cuerpo = {
    ...datosTurno,
    socioNombre: limpiarTextoPlano(datosTurno?.socioNombre || datosTurno?.SocioNombre),
    SocioNombre: limpiarTextoPlano(datosTurno?.SocioNombre || datosTurno?.socioNombre),
    socioDocumento: limpiarTextoPlano(datosTurno?.socioDocumento || datosTurno?.SocioDocumento),
    SocioDocumento: limpiarTextoPlano(datosTurno?.SocioDocumento || datosTurno?.socioDocumento),
    motivo,
    Motivo: motivo
  }

  const respuesta = await fetch(apiUrl('/turnos'), {
    method: 'POST',
    headers: obtenerHeadersAuth(),
    body: JSON.stringify(cuerpo)
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudo crear el turno'))
  }

  const datos = respuesta.status === 204 ? cuerpo : await respuesta.json()
  return normalizarTurno(datos)
}

export const obtenerTurnosPorSocio = async (idSocio) => {
  if (!idSocio) {
    throw new Error('No se pudo identificar el socio para cargar sus turnos.')
  }

  const respuesta = await fetch(apiUrl(`/turnos/socio/${idSocio}`), {
    method: 'GET',
    headers: obtenerHeadersAuth()
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'Error al obtener los turnos del socio'))
  }

  const datos = respuesta.status === 204 ? [] : await respuesta.json()
  return asegurarArray(datos).map(normalizarTurno)
}

export const aceptarPropuestaTurno = async (idTurno) => {
  if (!idTurno) {
    throw new Error('No se pudo identificar el turno a confirmar.')
  }

  const respuesta = await fetch(apiUrl(`/turnos/${idTurno}/aceptar-propuesta`), {
    method: 'PUT',
    headers: obtenerHeadersAuth()
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudo aceptar la propuesta'))
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json()
  return datos ? normalizarTurno(datos) : null
}

export const cancelarTurno = async (idTurno) => {
  if (!idTurno) {
    throw new Error('No se pudo identificar el turno a cancelar.')
  }

  const respuesta = await fetch(apiUrl(`/turnos/${idTurno}/cancelar`), {
    method: 'PUT',
    headers: obtenerHeadersAuth()
  })

  if (!respuesta.ok) {
    throw new Error(await leerError(respuesta, 'No se pudo cancelar el turno'))
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json()
  return datos ? normalizarTurno(datos) : true
}

export function useTurnos() {
  return useMemo(
    () => ({
      obtenerDisponibilidadTurnos,
      crearTurno,
      obtenerTurnosPorSocio,
      aceptarPropuestaTurno,
      cancelarTurno
    }),
    []
  )
}
