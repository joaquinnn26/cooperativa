import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import useAppStore from '@/store/appStore.js'
import {
  cleanText,
  firstValidationError,
  validateEmail,
  validateRequired,
  validateStrongPassword
} from '@/utils/validation.js'

async function tryRecoverPassword(email) {
  const response = await fetch(apiUrl('/auth/recuperar-contrasena'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.Message || data?.message || 'No se pudo iniciar la recuperacion.')
  }

  return data || {}
}

async function resetPassword(payload) {
  const response = await fetch(apiUrl('/auth/restablecer-contrasena'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.Message || data?.message || 'No se pudo restablecer la contrasena.')
  }

  return data
}

export default function RecoverPassword() {
  const addNotification = useAppStore((state) => state.addNotification)
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') || '')
  const [submitting, setSubmitting] = useState(false)
  const [resetForm, setResetForm] = useState(() => ({
    token: new URLSearchParams(window.location.search).get('token') || '',
    nueva: '',
    confirmar: ''
  }))

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateEmail(email)
    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    setSubmitting(true)

    try {
      const result = await tryRecoverPassword(cleanText(email).toLowerCase())
      if (result.resetToken) {
        setResetForm((current) => ({ ...current, token: result.resetToken }))
      }
      addNotification({
        title: 'Solicitud enviada',
        message: result.resetToken
          ? 'Se genero un token de desarrollo. Completa el restablecimiento en esta pantalla.'
          : 'Si el correo existe, recibiras instrucciones para recuperar tu contrasena.',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'No disponible',
        message: error.message || 'No se pudo iniciar la recuperacion de contrasena.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()

    const validationError = firstValidationError([
      validateRequired(resetForm.token, 'El token'),
      validateStrongPassword(resetForm.nueva, 'La nueva contrasena')
    ])
    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }
    if (resetForm.nueva !== resetForm.confirmar) {
      addNotification({
        title: 'Datos invalidos',
        message: 'La nueva contrasena y la confirmacion no coinciden.',
        type: 'error'
      })
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({
        email: cleanText(email).toLowerCase(),
        token: cleanText(resetForm.token),
        passwordNueva: resetForm.nueva,
        confirmarPassword: resetForm.confirmar
      })
      addNotification({
        title: 'Contrasena actualizada',
        message: 'Ya puedes iniciar sesion con tu nueva contrasena.',
        type: 'success'
      })
      setResetForm({ token: '', nueva: '', confirmar: '' })
    } catch (error) {
      addNotification({
        title: 'No se pudo restablecer',
        message: error.message,
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <KeyRound className="h-8 w-8 text-amber-700" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Recuperar contrasena</h1>
          <p className="text-gray-600">Ingresa tu correo para solicitar el recupero de acceso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Correo electronico</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="input-field"
              placeholder="tu@email.com"
            />
          </div>

          <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-60">
            {submitting ? 'Enviando...' : 'Solicitar recuperacion'}
          </button>
        </form>

        <form onSubmit={handleReset} className="mt-8 space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">Ya tengo un token</h2>
          <input
            value={resetForm.token}
            onChange={(event) => setResetForm((current) => ({ ...current, token: event.target.value }))}
            className="input-field"
            placeholder="Token de recuperacion"
          />
          <input
            type="password"
            value={resetForm.nueva}
            onChange={(event) => setResetForm((current) => ({ ...current, nueva: event.target.value }))}
            className="input-field"
            placeholder="Nueva contrasena"
          />
          <input
            type="password"
            value={resetForm.confirmar}
            onChange={(event) => setResetForm((current) => ({ ...current, confirmar: event.target.value }))}
            className="input-field"
            placeholder="Confirmar nueva contrasena"
          />
          <button type="submit" disabled={submitting} className="w-full btn-secondary disabled:opacity-60">
            Restablecer contrasena
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Volver a iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  )
}
