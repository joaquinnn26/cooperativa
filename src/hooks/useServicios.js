import { useCallback, useEffect, useState } from 'react'

import { apiUrl } from '@/config/api.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useServicios(autoLoad = true) {
  const [servicios, setServicios] = useState([])
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [tiposTarifa, setTiposTarifa] = useState([])
  const [loadingTiposTarifa, setLoadingTiposTarifa] = useState(false)

  const fetchServicios = useCallback(async () => {
    setLoadingServicios(true)
    try {
      const data = await jsonFetch(apiUrl('/servicio'))
      setServicios(data)
    } catch (error) {
      console.error('Error al cargar servicios', error)
    } finally {
      setLoadingServicios(false)
    }
  }, [])

  const fetchTiposTarifa = useCallback(async () => {
    setLoadingTiposTarifa(true)
    try {
      const data = await jsonFetch(apiUrl('/tipotarifa'))
      setTiposTarifa(data)
      return data
    } catch (error) {
      console.error('Error al cargar tipos de tarifa', error)
      return []
    } finally {
      setLoadingTiposTarifa(false)
    }
  }, [])

  const crearServicio = useCallback(async (payload) => {
    const servicioCreado = await jsonFetch(apiUrl('/servicio'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    await fetchServicios()
    return servicioCreado
  }, [fetchServicios])

  const editarServicio = useCallback(async (idServicio, payload) => {
    const servicioActualizado = await jsonFetch(apiUrl(`/servicio/${idServicio}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    await fetchServicios()
    return servicioActualizado
  }, [fetchServicios])

  const eliminarServicio = useCallback(async (idServicio) => {
    const res = await fetch(apiUrl(`/servicio/${idServicio}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    await fetchServicios()
  }, [fetchServicios])

  useEffect(() => {
    if (autoLoad) fetchServicios()
  }, [autoLoad, fetchServicios])

  return {
    servicios,
    loadingServicios,
    fetchServicios,
    tiposTarifa,
    loadingTiposTarifa,
    fetchTiposTarifa,
    crearServicio,
    editarServicio,
    eliminarServicio
  }
}
