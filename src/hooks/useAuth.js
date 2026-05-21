import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '@/config/api.js'

async function jsonFetch(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {})
  }

  const res = await fetch(url, {
    headers,
    ...options
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `HTTP ${res.status}`)
  }

  return res.status === 204 ? null : res.json()
}

export function useAuth() {
  const [session, setSession] = useState(() => ({
    token: localStorage.getItem('token') || null,
    usuario: localStorage.getItem('usuario') || null,
    email: localStorage.getItem('email') || null,
    rol: localStorage.getItem('rol') || null,
    cargo: localStorage.getItem('cargo') || null,
    idSocio: localStorage.getItem('idSocio') || null,
    idEmpleado: localStorage.getItem('idEmpleado') || null
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const data = await jsonFetch(apiUrl('/auth/login'), {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (data?.token) {
        localStorage.setItem('token', data.token)
      } else {
        localStorage.removeItem('token')
      }

      localStorage.setItem('usuario', data?.usuario != null ? String(data.usuario) : '')
      localStorage.setItem('email', email)
      localStorage.setItem('rol', data?.rol ?? '')
      if (data?.cargo) {
        localStorage.setItem('cargo', String(data.cargo))
      } else {
        localStorage.removeItem('cargo')
      }

      if (data?.idSocio != null) {
        localStorage.setItem('idSocio', String(data.idSocio))
      } else {
        localStorage.removeItem('idSocio')
      }

      if (data?.idEmpleado != null) {
        localStorage.setItem('idEmpleado', String(data.idEmpleado))
      } else {
        localStorage.removeItem('idEmpleado')
      }

      setSession({
        token: data?.token ?? null,
        usuario: data?.usuario != null ? String(data.usuario) : null,
        email,
        rol: data?.rol ?? null,
        cargo: data?.cargo != null ? String(data.cargo) : null,
        idSocio: data?.idSocio != null ? String(data.idSocio) : null,
        idEmpleado: data?.idEmpleado != null ? String(data.idEmpleado) : null
      })

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('email')
    localStorage.removeItem('rol')
    localStorage.removeItem('cargo')
    localStorage.removeItem('idSocio')
    localStorage.removeItem('idEmpleado')
    setSession({ token: null, usuario: null, email: null, rol: null, cargo: null, idSocio: null, idEmpleado: null })
    setError(null)
  }, [])

  useEffect(() => {
    setSession({
      token: localStorage.getItem('token') || null,
      usuario: localStorage.getItem('usuario') || null,
      email: localStorage.getItem('email') || null,
      rol: localStorage.getItem('rol') || null,
      cargo: localStorage.getItem('cargo') || null,
      idSocio: localStorage.getItem('idSocio') || null,
      idEmpleado: localStorage.getItem('idEmpleado') || null
    })
  }, [])

  return {
    user: session,
    token: session.token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: Boolean(session.token || session.usuario)
  }
}
