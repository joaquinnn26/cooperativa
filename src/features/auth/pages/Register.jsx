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
    telefono: '',
    accept: false
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const data = await register(form)

      window.alert(
        `Registro exitoso.\n\nTus credenciales:\n\nUsuario: ${data.usuario}\nContrasena temporal: ${
          data.passwordTemporal || ''
        }\n\nGuarda esta informacion en un lugar seguro.`
      )

      addNotification({
        title: 'Cuenta creada',
        message: 'Registro exitoso, ya puedes usar el portal.',
        type: 'success'
      })

      navigate('/login')
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo completar el registro.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-600">Registrate para gestionar tus servicios.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Documento</label>
              <input
                name="documento"
                value={form.documento}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Tu numero de documento"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nombre</label>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Apellido</label>
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
              <label className="mb-2 block text-sm font-medium text-gray-700">Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Tu numero de telefono"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Correo electronico</label>
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

          <label className="flex items-start space-x-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="accept"
              checked={form.accept}
              onChange={handleChange}
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              Acepto los{' '}
              <Link to="/terminos" className="text-blue-600 hover:text-blue-500">
                terminos y condiciones
              </Link>
            </span>
          </label>

          <button type="submit" className="w-full btn-primary">
            Crear cuenta
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Ya tienes cuenta?
            <Link to="/login" className="ml-1 font-medium text-blue-600 hover:text-blue-500">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
