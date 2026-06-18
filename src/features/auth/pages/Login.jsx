import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import { cleanText, firstValidationError, validateEmail, validateRequired } from '@/utils/validation.js'

export default function Login() {
  const login = useAuthStore((state) => state.login)
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    const validationError = firstValidationError([
      validateEmail(form.email),
      validateRequired(form.password, 'La contrasena')
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    setIsLoading(true)

    try {
      const data = await login({
        ...form,
        email: cleanText(form.email).toLowerCase()
      })

      addNotification({
        title: 'Bienvenido',
        message: data.mensaje || 'Has iniciado sesion correctamente.',
        type: 'success'
      })

      const rol = data.rol
      const redirect = rol === 'Administrador' ? '/admin' : rol === 'Empleado' ? '/empleado' : '/socio'
      navigate(redirect, { replace: true })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'Credenciales incorrectas.',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Iniciar sesion</h1>
          <p className="text-gray-600">Accede a tu cuenta</p>
        </div>

        {location.state?.expired ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu sesion expiro. Tienes que iniciar sesion nuevamente para continuar.
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Correo electronico</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              required
              className="input-field"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Contrasena</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              required
              className="input-field"
              placeholder="Tu contrasena"
            />
            <div className="mt-2 text-right">
              <Link to="/recuperar-contrasena" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Olvide mi contrasena
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-start">
            <label className="flex items-center text-sm text-gray-700">
              <input
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2">Recordarme</span>
            </label>
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
            {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            No tienes cuenta?
            <Link to="/register" className="ml-1 font-medium text-blue-600">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
