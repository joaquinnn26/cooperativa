import React, { useEffect, useMemo, useState } from 'react'
import { KeyRound, Save, UserCircle2 } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { useSocios } from '@/hooks/useSocios.js'
import {
  cleanText,
  firstValidationError,
  isBlank,
  isValidAddress,
  isValidHouseNumber,
  validateEmail,
  validatePhone,
  validateRequired,
  validateStrongPassword
} from '@/utils/validation.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function tryChangePassword(payload) {
  const response = await fetch(apiUrl('/auth/cambiar-contrasena'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.Message || data?.message || 'No se pudo cambiar la contrasena.')
  }

  return data
}

export default function SocioPerfil() {
  const { socioId, loadingSocio } = useCurrentSocio()
  const { fetchSocios, editarSocio } = useSocios(false)
  const addNotification = useAppStore((state) => state.addNotification)
  const updateProfileSession = useAuthStore((state) => state.updateProfileSession)
  const sessionName = useAuthStore((state) => state.nombre)
  const sessionEmail = useAuthStore((state) => state.email)
  const sessionUser = useAuthStore((state) => state.usuario)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [contactForm, setContactForm] = useState({
    Telefono: '',
    Email: '',
    Calle: '',
    Numero: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  })

  useEffect(() => {
    if (!socioId) {
      if (!loadingSocio) {
        setLoading(false)
      }
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      try {
        const socios = await fetchSocios()
        const current = (socios || []).find((item) => String(item.idSocio) === String(socioId)) || null
        setProfile(current)
        setContactForm({
          Telefono: current?.Persona?.Telefono || '',
          Email: current?.Persona?.Email || sessionEmail || '',
          Calle: current?.Persona?.Calle || '',
          Numero: current?.Persona?.Numero || ''
        })
      } catch (error) {
        addNotification({
          title: 'Error',
          message: error.message || 'No se pudieron cargar tus datos.',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [addNotification, fetchSocios, loadingSocio, sessionEmail, socioId])

  const fullName = useMemo(() => {
    if (!profile?.Persona) return sessionName || sessionUser || 'Usuario'
    return [profile.Persona.Nombre, profile.Persona.Apellido].filter(Boolean).join(' ').trim()
  }, [profile, sessionName, sessionUser])

  const handleProfileSave = async (event) => {
    event.preventDefault()

    if (!profile?.idSocio) return

    const validationError = firstValidationError([
      validatePhone(contactForm.Telefono),
      validateEmail(contactForm.Email),
      !isBlank(contactForm.Calle) && !isValidAddress(contactForm.Calle) ? 'La calle contiene caracteres invalidos.' : '',
      !isBlank(contactForm.Numero) && !isValidHouseNumber(contactForm.Numero) ? 'El numero de domicilio debe ser numerico.' : ''
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    setSavingProfile(true)

    try {
      await editarSocio(profile.idSocio, {
        Nombre: profile.Persona?.Nombre,
        Apellido: profile.Persona?.Apellido,
        Documento: profile.Persona?.Documento,
        Telefono: cleanText(contactForm.Telefono),
        Email: cleanText(contactForm.Email).toLowerCase(),
        Calle: cleanText(contactForm.Calle) || null,
        Numero: cleanText(contactForm.Numero) || null
      })

      updateProfileSession({
        email: cleanText(contactForm.Email).toLowerCase() || sessionEmail,
        nombre: fullName
      })

      setProfile((current) =>
        current
          ? {
              ...current,
              Persona: {
                ...current.Persona,
                Telefono: cleanText(contactForm.Telefono),
                Email: cleanText(contactForm.Email).toLowerCase(),
                Calle: cleanText(contactForm.Calle),
                Numero: cleanText(contactForm.Numero)
              }
            }
          : current
      )

      addNotification({
        title: 'Perfil actualizado',
        message: 'Tus datos personales fueron actualizados.',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron guardar tus datos.',
        type: 'error'
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (event) => {
    event.preventDefault()

    const validationError = firstValidationError([
      validateRequired(passwordForm.actual, 'La contrasena actual'),
      validateStrongPassword(passwordForm.nueva, 'La nueva contrasena')
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    if (passwordForm.nueva !== passwordForm.confirmar) {
      addNotification({
        title: 'Error',
        message: 'La nueva contrasena y la confirmacion no coinciden.',
        type: 'error'
      })
      return
    }

    setSavingPassword(true)

    try {
      await tryChangePassword({
        passwordActual: passwordForm.actual,
        passwordNueva: passwordForm.nueva,
        nuevaPassword: passwordForm.nueva,
        confirmarPassword: passwordForm.confirmar,
        email: contactForm.Email || sessionEmail
      })

      setPasswordForm({
        actual: '',
        nueva: '',
        confirmar: ''
      })

      addNotification({
        title: 'Contrasena actualizada',
        message: 'Tu contrasena fue actualizada correctamente.',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'No disponible',
        message: error.message || 'No se pudo cambiar la contrasena.',
        type: 'error'
      })
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-gray-600">Cargando perfil...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi perfil</h1>
        <p className="mt-2 text-gray-600">Gestiona tus datos de contacto, direccion y contrasena.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <UserCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-600">Usuario: {sessionUser || 'No informado'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Documento</p>
              <p className="mt-1 font-semibold text-gray-900">{profile?.Persona?.Documento || 'No informado'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Nombre y apellido</p>
              <p className="mt-1 font-semibold text-gray-900">{fullName}</p>
              <p className="mt-2 text-sm text-gray-500">Estos datos no se modifican desde el portal.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="card space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Datos personales</h2>
            <p className="mt-1 text-sm text-gray-500">Aqui puedes actualizar los datos que si se pueden modificar.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Telefono</label>
              <input
                value={contactForm.Telefono}
                onChange={(event) => setContactForm((prev) => ({ ...prev, Telefono: event.target.value }))}
                className="input-field"
                placeholder="Tu numero de telefono"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Correo electronico</label>
              <input
                type="email"
                value={contactForm.Email}
                onChange={(event) => setContactForm((prev) => ({ ...prev, Email: event.target.value }))}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Calle</label>
              <input
                value={contactForm.Calle}
                onChange={(event) => setContactForm((prev) => ({ ...prev, Calle: event.target.value }))}
                className="input-field"
                placeholder="Tu calle"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Numero</label>
              <input
                value={contactForm.Numero}
                onChange={(event) => setContactForm((prev) => ({ ...prev, Numero: event.target.value }))}
                className="input-field"
                placeholder="Numero de puerta"
              />
            </div>
          </div>

          <button type="submit" disabled={savingProfile} className="inline-flex items-center btn-primary disabled:opacity-60">
            <Save className="mr-2 h-4 w-4" />
            {savingProfile ? 'Guardando...' : 'Guardar datos'}
          </button>
        </form>
      </div>

      <form onSubmit={handlePasswordSave} className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-3 text-amber-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cambiar contrasena</h2>
            <p className="text-sm text-gray-500">El cambio requiere validar tu contrasena actual.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Contrasena actual</label>
            <input
              type="password"
              value={passwordForm.actual}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, actual: event.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nueva contrasena</label>
            <input
              type="password"
              value={passwordForm.nueva}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, nueva: event.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Confirmar nueva contrasena</label>
            <input
              type="password"
              value={passwordForm.confirmar}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmar: event.target.value }))}
              className="input-field"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={savingPassword} className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
          <KeyRound className="mr-2 h-4 w-4" />
          {savingPassword ? 'Guardando...' : 'Cambiar contrasena'}
        </button>
      </form>
    </div>
  )
}
