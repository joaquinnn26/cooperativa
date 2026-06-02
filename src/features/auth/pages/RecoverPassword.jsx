import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import useAppStore from '@/store/appStore.js'

async function tryRecoverPassword(email) {
  const attempts = [
    { path: '/auth/recuperar-contrasena', body: { email } },
    { path: '/auth/forgot-password', body: { email } },
    { path: '/auth/reset-password-request', body: { email } }
  ]

  for (const attempt of attempts) {
    try {
      const response = await fetch(apiUrl(attempt.path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attempt.body)
      })

      if (response.ok) {
        return true
      }
    } catch {
      // continue trying
    }
  }

  throw new Error('Tu API todavia no tiene un endpoint de recuperacion de contrasena disponible.')
}

export default function RecoverPassword() {
  const addNotification = useAppStore((state) => state.addNotification)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await tryRecoverPassword(email.trim())
      addNotification({
        title: 'Solicitud enviada',
        message: 'Si el correo existe, recibiras instrucciones para recuperar tu contrasena.',
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

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Volver a iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  )
}
