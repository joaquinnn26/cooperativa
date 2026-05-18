import { create } from 'zustand'
import { apiUrl } from '@/config/api.js'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  //rol: localStorage.getItem('rol') || null,
  usuario: localStorage.getItem('usuario') || null,

  login: async (form) => {
    const res = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password
      })
    })

    if (!res.ok) throw new Error('Login error')

    const data = await res.json()

    localStorage.setItem('token', data.token)
    //localStorage.setItem('rol', data.rol)
    localStorage.setItem('usuario', data.usuario)

    set({
      token: data.token,
      //rol: data.rol,
      usuario: data.usuario
    })

    return data
  },

  register: async (form) => {
    const res = await fetch(apiUrl('/socio'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Documento: form.documento,
        Nombre: form.nombre,
        Apellido: form.apellido,
        Email: form.email
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || 'Registration error')
    }

    return res.json()
  },

  logout: () => {
    localStorage.clear()
    set({ token: null, rol: null, usuario: null })
  },

  getAuthHeaders: () => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }
}))

export default useAuthStore
