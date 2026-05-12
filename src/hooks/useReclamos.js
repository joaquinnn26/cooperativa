import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '@/config/api.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function readError(res, fallbackMessage) {
  try {
    const data = await res.json()
    return data?.mensaje || data?.message || fallbackMessage
  } catch {
    const errorText = await res.text()
    return errorText || fallbackMessage
  }
}

export function useReclamos(socioId) {
  const [reclamos, setReclamos] = useState([])
  const [tiposReclamo, setTiposReclamo] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchReclamosPorSocio = useCallback(
    async (id = socioId) => {
      if (!id) {
        setReclamos([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(apiUrl(`/reclamo/socio/${id}`), {
          headers: getAuthHeaders()
        })
        if (!res.ok) throw new Error(await readError(res, 'No se pudieron obtener reclamos'))
        const data = await res.json()
        setReclamos(data)
      } catch (error) {
        console.error('Error al obtener reclamos:', error)
      } finally {
        setLoading(false)
      }
    },
    [socioId]
  )

  const fetchTiposReclamo = useCallback(async () => {
    const res = await fetch(apiUrl('/reclamo/tipoReclamo'), {
      headers: getAuthHeaders()
    })

    if (!res.ok) {
      throw new Error(await readError(res, 'No se pudieron obtener los tipos de reclamo'))
    }

    const data = await res.json()
    setTiposReclamo(data)
    return data
  }, [])

  const crearReclamo = useCallback(async (payload) => {
    const res = await fetch(apiUrl('/reclamo'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      throw new Error(await readError(res, 'No se pudo crear el reclamo'))
    }

    return res.json()
  }, [])

  useEffect(() => {
    fetchReclamosPorSocio()
  }, [fetchReclamosPorSocio])

  return {
    reclamos,
    tiposReclamo,
    loading,
    fetchReclamosPorSocio,
    fetchTiposReclamo,
    crearReclamo
  }
}
