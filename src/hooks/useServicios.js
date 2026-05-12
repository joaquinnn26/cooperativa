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

  useEffect(() => {
    if (autoLoad) fetchServicios()
  }, [autoLoad, fetchServicios])

  return { servicios, loadingServicios, fetchServicios }
}
