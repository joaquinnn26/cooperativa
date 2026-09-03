import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import { showInfo } from '@/utils/alerts.js'
import {
  cleanText,
  FIELD_LIMITS,
  firstValidationError,
  validateAddress,
  validateDocument,
  validateEmail,
  validateHouseNumber,
  validatePersonName,
  validatePhone
} from '@/utils/validation.js'

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
    calle: '',
    numero: '',
    accept: false
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = firstValidationError([
      validateDocument(form.documento),
      validatePersonName(form.nombre, 'El nombre'),
      validatePersonName(form.apellido, 'El apellido'),
      validatePhone(form.telefono),
      validateEmail(form.email),
      validateAddress(form.calle),
      validateHouseNumber(form.numero),
      !form.accept ? 'Debes aceptar los terminos y condiciones.' : ''
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    try {
      const data = await register({
        ...form,
        documento: cleanText(form.documento),
        nombre: cleanText(form.nombre),
        apellido: cleanText(form.apellido),
        telefono: cleanText(form.telefono),
        email: cleanText(form.email).toLowerCase(),
        calle: cleanText(form.calle),
        numero: cleanText(form.numero)
      })

      await showInfo({
        title: 'Cuenta creada',
        message: `Tus credenciales:\n\nUsuario: ${data.usuario}\nContrasena temporal: ${
          data.passwordTemporal || ''
        }\n\nGuarda esta informacion en un lugar seguro.`,
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
                minLength={FIELD_LIMITS.document.min}
                maxLength={FIELD_LIMITS.document.max}
                inputMode="numeric"
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
                minLength={FIELD_LIMITS.personName.min}
                maxLength={FIELD_LIMITS.personName.max}
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
                minLength={FIELD_LIMITS.personName.min}
                maxLength={FIELD_LIMITS.personName.max}
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
                minLength={FIELD_LIMITS.phone.min}
                maxLength={FIELD_LIMITS.phone.max}
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
              minLength={FIELD_LIMITS.email.min}
              maxLength={FIELD_LIMITS.email.max}
              className="input-field"
              placeholder="tu@email.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Calle</label>
              <input
                name="calle"
                value={form.calle}
                onChange={handleChange}
                required
                minLength={FIELD_LIMITS.address.min}
                maxLength={FIELD_LIMITS.address.max}
                pattern="[\p{L}0-9 .'\-]+"
                title="La calle solo puede contener letras, numeros, espacios, puntos, guiones y apostrofes."
                className="input-field"
                placeholder="Calle del domicilio"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Numero</label>
              <input
                name="numero"
                value={form.numero}
                onChange={handleChange}
                required
                minLength={FIELD_LIMITS.houseNumber.min}
                maxLength={FIELD_LIMITS.houseNumber.max}
                inputMode="numeric"
                pattern="\d{1,6}[A-Za-z]?"
                title="El numero debe tener hasta 6 digitos y opcionalmente una letra al final."
                className="input-field"
                placeholder="Altura"
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
