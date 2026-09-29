import { create } from 'zustand'
import { apiUrl } from '@/config/api.js'
import { isTokenExpired } from '@/utils/auth.js'

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
    altaSocio: data?.altaSocio ?? null,
    cargo: data?.cargo ?? data?.Cargo ?? null,
    idSocio: data?.idSocio ?? data?.IdSocio ?? null,
    areas: Array.isArray(data?.areas) ? data.areas : [],
    idEmpleado: data?.idEmpleado ?? data?.IdEmpleado ?? null
  }
}

function clearSessionStorage() {
  for (const key of ['token', 'rol', 'cargo', 'usuario', 'email', 'nombre', 'idSocio', 'idEmpleado']) {
    localStorage.removeItem(key)
  }
}

function saveVerifiedSession(token, data) {
  localStorage.setItem('token', token)
  localStorage.setItem('rol', data.rol || '')
  localStorage.setItem('usuario', data.usuario || '')
  localStorage.setItem('email', data.email || '')
  localStorage.setItem('nombre', data.nombre || '')

  for (const [key, value] of [
    ['cargo', data.cargo],
    ['idSocio', data.idSocio],
    ['idEmpleado', data.idEmpleado]
  ]) {
    if (value != null && value !== '') localStorage.setItem(key, String(value))
    else localStorage.removeItem(key)
  }
}

const storedToken = localStorage.getItem('token')
const initialToken = storedToken && !isTokenExpired(storedToken) ? storedToken : null
if (!initialToken) clearSessionStorage()

const useAuthStore = create((set) => ({
  token: initialToken,
  rol: null,
  altaSocio: null,
  cargo: null,
  usuario: null,
  email: null,
  nombre: null,
  idSocio: null,
  idEmpleado: null,
        areas: [],
  sessionStatus: initialToken ? 'checking' : 'anonymous',

  verifySession: async () => {
    const token = localStorage.getItem('token')
    if (!token || isTokenExpired(token)) {
      clearSessionStorage()
      set({
        token: null,
        rol: null,
        altaSocio: null,
        cargo: null,
        usuario: null,
        email: null,
        nombre: null,
        idSocio: null,
        idEmpleado: null,
        areas: [],
        sessionStatus: 'anonymous'
      })
      return false
    }

    set({ sessionStatus: 'checking' })

    try {
      const response = await fetch(apiUrl('/auth/session'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Sesion invalida.')

      const data = normalizeLoginResponse(await response.json())
      saveVerifiedSession(token, data)
      set({
        token,
        rol: data.rol,
        altaSocio: data.altaSocio,
        cargo: data.cargo != null ? String(data.cargo) : null,
        usuario: data.usuario,
        email: data.email || null,
        nombre: data.nombre,
        idSocio: data.idSocio != null ? String(data.idSocio) : null,
        idEmpleado: data.idEmpleado != null ? String(data.idEmpleado) : null,
        areas: data.areas,
        sessionStatus: 'authenticated'
      })
      return true
    } catch {
      clearSessionStorage()
      set({
        token: null,
        rol: null,
        altaSocio: null,
        cargo: null,
        usuario: null,
        email: null,
        nombre: null,
        idSocio: null,
        idEmpleado: null,
        areas: [],
        sessionStatus: 'anonymous'
      })
      return false
    }
  },

  login: async (form) => {
    const res = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        TipoAcceso: form.tipoAcceso
      })
    })

    if (!res.ok) {
      const error = await res.json().catch(() => null)
      throw new Error(error?.Message || error?.message || 'No se pudo iniciar sesión.')
    }

    const data = normalizeLoginResponse(await res.json())

    if (!data.token) throw new Error('La API no devolvio un token valido.')
    saveVerifiedSession(data.token, { ...data, email: data.email || form.email })

    set({
      token: data.token,
      rol: data.rol,
      altaSocio: data.altaSocio,
      cargo: data.cargo != null ? String(data.cargo) : null,
      usuario: String(data.usuario),
      email: form.email,
      nombre: data.nombre,
      idSocio: data.idSocio != null ? String(data.idSocio) : null,
      idEmpleado: data.idEmpleado != null ? String(data.idEmpleado) : null,
      areas: data.areas,
        sessionStatus: 'authenticated'
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
        Telefono: form.telefono,
        Calle: form.calle,
        Numero: form.numero,
        EsTitular: form.esTitular === true || form.esTitular === 'si'
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || 'Registration error')
    }

    return res.json()
  },

  logout: () => {
    clearSessionStorage()
    set({
      token: null,
      rol: null,
      altaSocio: null,
      cargo: null,
      usuario: null,
      email: null,
      nombre: null,
      idSocio: null,
      idEmpleado: null,
        areas: [],
      sessionStatus: 'anonymous'
    })
  },

  updateAltaSocio: (altaSocio) => set({ altaSocio }),

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
