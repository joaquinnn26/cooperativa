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
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
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

      // Guardar token y user en localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)

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
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  // Cargar usuario si hay token en localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token
  }
}
