import { useCallback, useEffect, useState } from 'react'

import { API_BASE_PATH, apiUrl } from '@/config/api.js'

const API_BASE = API_BASE_PATH

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `HTTP ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export function useSocios(autoLoad = true) {
  const [socios, setSocios] = useState([])
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingServicios, setLoadingServicios] = useState(false)

  const fetchSocios = useCallback(async () => {
    setLoading(true)
    try {
      const data = await jsonFetch(apiUrl('/socio'))
      setSocios(data)
    } catch (error) {
      console.error('Error al obtener socios', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchServicios = useCallback(async () => {
    setLoadingServicios(true)
    try {
      const data = await jsonFetch(apiUrl('/servicio'))
      setServicios(data)
    } catch (error) {
      console.error('Error al obtener servicios', error)
    } finally {
      setLoadingServicios(false)
    }
  }, [])

  const crearSocio = useCallback(async (payload) => {
    const socio = await jsonFetch(apiUrl('/socio'), {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    await fetchSocios()
    return socio
  }, [fetchSocios])

  const editarSocio = useCallback(
    async (id, payload) => {
      await jsonFetch(apiUrl(`/socio/${id}`), {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      await fetchSocios()
    },
    [fetchSocios]
  )

  const eliminarSocio = useCallback(
    async (id) => {
      await jsonFetch(apiUrl(`/socio/${id}`), { method: 'DELETE' })
      setSocios((prev) => prev.filter((s) => s.idSocio !== id))
    },
    []
  )

  const asignarServicios = useCallback(async (idSocio, serviciosIds) => {
    await jsonFetch(apiUrl(`/serviciosocio/${idSocio}`), {
      method: 'POST',
      body: JSON.stringify(serviciosIds)
    })
  }, [])

  const fetchServiciosSocio = useCallback(async (idSocio) => {
    return jsonFetch(apiUrl(`/serviciosocio/${idSocio}`))
  }, [])

  const toggleEstadoSocio = useCallback(
    async (socioId) => {
      await jsonFetch(apiUrl(`/socio/estado/${socioId}`), { method: 'PUT' })
      setSocios((prev) =>
        prev.map((s) => (s.idSocio === socioId ? { ...s, Activo: !s.Activo } : s))
      )
    },
    []
  )

  useEffect(() => {
    if (autoLoad) {
      fetchSocios()
      fetchServicios()
    }
  }, [autoLoad, fetchSocios, fetchServicios])

  return {
    socios,
    servicios,
    loading,
    loadingServicios,
    fetchSocios,
    fetchServicios,
    crearSocio,
    editarSocio,
    eliminarSocio,
    asignarServicios,
    fetchServiciosSocio,
    toggleEstadoSocio
  }
}
