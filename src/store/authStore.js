import { create } from 'zustand'
import { apiUrl } from '@/config/api.js'

function normalizeRole(rawRole) {
  if (!rawRole) return null
  const value = String(rawRole).trim().toLowerCase()
  if (value === 'admin' || value === 'administrador') return 'Administrador'
  if (value === 'empleado') return 'Empleado'
  if (value === 'socio') return 'Socio'
  return String(rawRole).trim()
}

function normalizeLoginResponse(data) {
  return {
    ...data,
    token: data?.token ?? data?.Token ?? null,
    usuario: data?.usuario != null ? String(data.usuario) : data?.Usuario != null ? String(data.Usuario) : '',
    nombre:
      data?.nombre ??
      data?.Nombre ??
      (data?.usuario != null ? String(data.usuario) : data?.Usuario != null ? String(data.Usuario) : ''),
    rol: normalizeRole(data?.rol ?? data?.Rol),
    cargo: data?.cargo ?? data?.Cargo ?? null,
    idSocio: data?.idSocio ?? data?.IdSocio ?? null,
    idEmpleado: data?.idEmpleado ?? data?.IdEmpleado ?? null
  }
}

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  rol: localStorage.getItem('rol') || null,
  cargo: localStorage.getItem('cargo') || null,
  usuario: localStorage.getItem('usuario') || null,
  email: localStorage.getItem('email') || null,
  nombre: localStorage.getItem('nombre') || null,
  idSocio: localStorage.getItem('idSocio') || null,
  idEmpleado: localStorage.getItem('idEmpleado') || null,

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

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || 'Login error')
    }

    const data = normalizeLoginResponse(await res.json())

    if (data.token) {
      localStorage.setItem('token', data.token)
    } else {
      localStorage.removeItem('token')
    }
    localStorage.setItem('rol', data.rol || '')
    if (data.cargo) {
      localStorage.setItem('cargo', String(data.cargo))
    } else {
      localStorage.removeItem('cargo')
    }
    localStorage.setItem('usuario', String(data.usuario))
    localStorage.setItem('email', form.email)
    localStorage.setItem('nombre', data.nombre)
    if (data.idSocio != null) {
      localStorage.setItem('idSocio', String(data.idSocio))
    } else {
      localStorage.removeItem('idSocio')
    }
    if (data.idEmpleado != null) {
      localStorage.setItem('idEmpleado', String(data.idEmpleado))
    } else {
      localStorage.removeItem('idEmpleado')
    }

    set({
      token: data.token,
      rol: data.rol,
      cargo: data.cargo != null ? String(data.cargo) : null,
      usuario: String(data.usuario),
      email: form.email,
      nombre: data.nombre,
      idSocio: data.idSocio != null ? String(data.idSocio) : null,
      idEmpleado: data.idEmpleado != null ? String(data.idEmpleado) : null
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
        Email: form.email,
        Telefono: form.telefono
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
    set({ token: null, rol: null, cargo: null, usuario: null, email: null, nombre: null, idSocio: null, idEmpleado: null })
  },

  setResolvedEmpleadoId: (idEmpleado) => {
    if (idEmpleado != null) {
      localStorage.setItem('idEmpleado', String(idEmpleado))
    } else {
      localStorage.removeItem('idEmpleado')
    }

    set({ idEmpleado: idEmpleado != null ? String(idEmpleado) : null })
  },

  setResolvedSocioId: (idSocio) => {
    if (idSocio != null) {
      localStorage.setItem('idSocio', String(idSocio))
    } else {
      localStorage.removeItem('idSocio')
    }

    set({ idSocio: idSocio != null ? String(idSocio) : null })
  },

  updateProfileSession: ({ email, nombre, usuario } = {}) => {
    if (email != null) {
      localStorage.setItem('email', String(email))
    }

    if (nombre != null) {
      localStorage.setItem('nombre', String(nombre))
    }

    if (usuario != null) {
      localStorage.setItem('usuario', String(usuario))
    }

    set((state) => ({
      email: email != null ? String(email) : state.email,
      nombre: nombre != null ? String(nombre) : state.nombre,
      usuario: usuario != null ? String(usuario) : state.usuario
    }))
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
