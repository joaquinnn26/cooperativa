import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '@/config/api.js'
import useAuthStore from '@/store/authStore.js'
import { parseJwt } from '@/utils/auth.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

function findSocioIdInClaims(token) {
  const payload = parseJwt(token)
  if (!payload) return null

  const directKeys = ['idSocio', 'idsocio', 'IdSocio', 'socioId', 'nameid', 'sid', 'sub']
  for (const key of directKeys) {
    const value = Number(payload[key])
    if (Number.isInteger(value) && value > 0) return value
  }

  for (const [key, rawValue] of Object.entries(payload)) {
    if (!/idsocio|socioid|nameidentifier|nameid|sid/i.test(key)) continue
    const value = Number(rawValue)
    if (Number.isInteger(value) && value > 0) return value
  }

  return null
}

export function useCurrentSocio() {
  const token = useAuthStore((state) => state.token)
  const usuario = useAuthStore((state) => state.usuario)
  const rol = useAuthStore((state) => state.rol)

  const [socioId, setSocioId] = useState(() => findSocioIdInClaims(token))
  const [loadingSocio, setLoadingSocio] = useState(false)

  const resolveSocioId = useCallback(async () => {
    const tokenSocioId = findSocioIdInClaims(token)
    if (tokenSocioId) {
      setSocioId(tokenSocioId)
      return tokenSocioId
    }

    if (!token || !usuario || rol !== 'Socio') {
      setSocioId(null)
      return null
    }

    setLoadingSocio(true)

    try {
      const res = await fetch(apiUrl('/socio'), {
        headers: getAuthHeaders()
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'No se pudo resolver el socio actual')
      }

      const socios = await res.json()
      const socioActual = socios.find((socio) => String(socio.Persona?.Documento) === String(usuario))
      const resolvedId = socioActual?.idSocio ?? null

      setSocioId(resolvedId)
      return resolvedId
    } finally {
      setLoadingSocio(false)
    }
  }, [rol, token, usuario])

  useEffect(() => {
    resolveSocioId().catch((error) => {
      console.error('Error al resolver idSocio actual:', error)
      setSocioId(null)
    })
  }, [resolveSocioId])

  return { socioId, loadingSocio, resolveSocioId }
}
