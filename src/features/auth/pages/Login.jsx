import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, UserRound } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import cospralLogo from '@/assets/cospral-wordmark.png'
import loginBackground from '@/assets/images/login-background.png'
import './Login.css'
import { cleanText, FIELD_LIMITS, firstValidationError, validateRequired } from '@/utils/validation.js'

export default function Login() {
  const login = useAuthStore((state) => state.login)
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    tipoAcceso: 'Socio',
    email: '',
    password: '',
    remember: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const theme = {
    Socio: { tint: 'bg-blue-50/70', border: 'border-blue-200', button: 'bg-blue-700 hover:bg-blue-800 focus-visible:ring-blue-300' },
    Empleado: { tint: 'bg-emerald-50/70', border: 'border-emerald-200', button: 'bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-300' }
  }[form.tipoAcceso]

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
      validateRequired(form.email, 'El email o DNI'),
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
        email: cleanText(form.email).includes('@') ? cleanText(form.email).toLowerCase() : cleanText(form.email)
      })

      addNotification({
        title: 'Bienvenido',
        message: data.mensaje || 'Has iniciado sesion correctamente.',
        type: 'success'
      })

      const rol = data.rol
      const redirect = rol === 'Administrador' ? '/admin' : rol === 'Empleado' ? '/empleado' : data.altaSocio?.Estado && data.altaSocio.Estado !== 'Aprobada' ? '/socio/alta' : '/socio'
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
    <div className="login-background" style={{ backgroundImage: `url("${loginBackground}")` }}>
      <div className={`card w-full max-w-[416px] overflow-hidden border transition-all duration-300 ${theme.border}`}>
        <div className="mb-8 text-center">
          <img src={cospralLogo} alt="COSPRAL · Cooperativa de Agua y Luz" className="mx-auto mb-5 h-auto w-56 max-w-full object-contain" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Iniciar sesion</h1>
          <p className="text-gray-600">Accede a tu cuenta</p>
        </div>

        {location.state?.expired ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu sesion expiro. Tienes que iniciar sesion nuevamente para continuar.
          </div>
        ) : null}

        <form onSubmit={handleLogin} className={`space-y-5 rounded-2xl p-4 transition-colors duration-300 ${theme.tint}`}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">Selecciona el tipo de cuenta</legend>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de acceso">
              {[
                { tipo: 'Socio', Icon: UserRound, descripcion: 'Personal' },
                { tipo: 'Empleado', Icon: BriefcaseBusiness, descripcion: 'Laboral' }
              ].map(({ tipo, Icon, descripcion }) => {
                const selected = form.tipoAcceso === tipo
                const colors = {
                  Socio: selected ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md shadow-blue-900/10' : 'hover:border-blue-300',
                  Empleado: selected ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-md shadow-emerald-900/10' : 'hover:border-emerald-300'
                }[tipo]
                const iconColors = {
                  Socio: selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700',
                  Empleado: selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                }[tipo]
                return <button key={tipo} type="button" aria-pressed={selected} onClick={() => setForm(prev => ({ ...prev, tipoAcceso: tipo }))} className={`group flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 ${selected ? colors : `border-slate-200 bg-white text-slate-600 ${colors}`} hover:-translate-y-0.5 hover:shadow-sm`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${iconColors}`}><Icon size={15}/></span><span className="min-w-0"><strong className="block text-[11px] leading-tight sm:text-xs">{tipo}</strong><small className="mt-0.5 block text-[10px] opacity-75">{descripcion}</small></span></button>
              })}
            </div>
          </fieldset>
          <div>
            <label htmlFor="login-identifier" className="mb-2 block text-sm font-medium text-gray-700">Email o DNI</label>
            <input
              id="login-identifier"
              name="email"
              value={form.email}
              onChange={handleChange}
              type="text"
              required
              maxLength={FIELD_LIMITS.email.max}
              className="input-field"
              autoComplete="username"
              placeholder="Correo electronico o numero de DNI"
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
              minLength={FIELD_LIMITS.password.min}
              maxLength={FIELD_LIMITS.password.max}
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

          <button type="submit" disabled={isLoading} className={`w-full rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-50 ${theme.button}`}>
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
