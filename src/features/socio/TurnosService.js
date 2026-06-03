// Usamos la dirección directa para evitar el conflicto con api.js
const apiUri = 'http://localhost:58234/api'; 

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
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

// 1. CREAR TURNO
export const crearTurno = async (datosTurno) => {
  const response = await fetch(`${apiUri}/turnos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datosTurno)
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo crear el turno'))
  }
  return response.json()
}

// 2. TRAER TURNOS DE UN SOCIO
export const obtenerTurnosPorSocio = async (idSocio) => {
  const response = await fetch(`${apiUri}/turnos/socio/${idSocio}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error('Error al obtener los turnos del socio')
  }
  return await response.json()
}

// 3. ACEPTAR LA PROPUESTA DEL ADMIN
export const aceptarPropuestaBackend = async (idTurno) => {
  const response = await fetch(`${apiUri}/turnos/${idTurno}/aceptar-propuesta`, {
    method: 'PUT',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo aceptar la propuesta'))
  }
  return await response.json()
}
