import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = await login(form)

      addNotification({
        title: '¡Bienvenido!',
        message: data.mensaje || 'Has iniciado sesión correctamente',
        type: 'success'
      })

      const rol = data.rol

      const redirect =
        location.state?.from?.pathname ||
        (rol === 'Admin' ? '/admin' : rol === 'Empleado' ? '/empleado' : '/socio')

      navigate(redirect, { replace: true })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Credenciales incorrectas',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
          <p className="text-gray-600">Accede a tu cuenta</p>
        </div>

        {location.state?.expired ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu sesión expiró. Tenés que iniciar sesión nuevamente para continuar.
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              required
              className="input-field"
              placeholder="Tu contraseña"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              <input
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2">Recordarme</span>
            </label>

            <Link to="/forgot-password" className="text-sm text-blue-600">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿No tienes cuenta?
            <Link to="/register" className="text-blue-600 font-medium ml-1">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
