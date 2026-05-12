import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'

export default function Register() {
  const register = useAuthStore((state) => state.register)
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    documento: '',
    nombre: '',
    apellido: '',
    email: '',
    accept: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const data = await register(form)
      
      // Mostrar credenciales en alert
      alert(`✅ Registro exitoso!\n\nTus credenciales:\n\nUsuario: ${data.usuario}\nContraseña Temporal: ${data.passwordTemporal}\n\n⚠️ Guarda esta información en un lugar seguro`)
      
      addNotification({
        title: 'Cuenta creada',
        message: 'Registro exitoso, ya puedes usar el portal',
        type: 'success'
      })
      navigate('/login')
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo completar el registro',
        type: 'error'
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
          <p className="text-gray-600">Regístrate para gestionar tus servicios</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Documento</label>
              <input
                name="documento"
                value={form.documento}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Tu número de documento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Tu apellido"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <label className="flex items-start space-x-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="accept"
              checked={form.accept}
              onChange={handleChange}
              required
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span>
              Acepto los{' '}
              <Link to="/terminos" className="text-blue-600 hover:text-blue-500">
                términos y condiciones
              </Link>
            </span>
          </label>

          <button type="submit" className="w-full btn-primary">
            Crear Cuenta
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium ml-1">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
