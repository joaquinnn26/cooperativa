import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CheckCircle2, Clock3, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import PasswordInput from '@/components/PasswordInput.jsx'
import { apiUrl } from '@/config/api.js'
import useAppStore from '@/store/appStore.js'
import cospralLogo from '@/assets/cospral-wordmark.png'
import loginBackground from '@/assets/images/login-background.png'
import './RecoverPassword.css'
import { cleanText, FIELD_LIMITS, firstValidationError, validateEmail, validateMeaningfulText, validateStrongPassword } from '@/utils/validation.js'

async function tryRecoverPassword(email, tipoAcceso) {
  const response = await fetch(apiUrl('/auth/recuperar-contrasena'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, TipoAcceso: tipoAcceso }) })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(response.status >= 500 ? 'La recuperación por correo no está disponible temporalmente. Intentá nuevamente más tarde.' : data?.Message || data?.message || 'No se pudo iniciar la recuperación.')
  return data || {}
}

async function resetPassword(payload) {
  const response = await fetch(apiUrl('/auth/restablecer-contrasena'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.Message || data?.message || 'No se pudo restablecer la contraseña.')
  return data
}

export default function RecoverPassword() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const initialToken = params.get('token') || ''
  const addNotification = useAppStore((state) => state.addNotification)
  const [email, setEmail] = useState(() => params.get('email') || '')
  const [tipoAcceso, setTipoAcceso] = useState('Socio')
  const [submitting, setSubmitting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [resetForm, setResetForm] = useState({ token: initialToken, nueva: '', confirmar: '' })
  const hasRecoveryLink = Boolean(initialToken)
  const passwordChecks = [
    { label: '8 caracteres como mínimo', valid: resetForm.nueva.length >= 8 },
    { label: 'Una mayúscula y una minúscula', valid: /[A-Z]/.test(resetForm.nueva) && /[a-z]/.test(resetForm.nueva) },
    { label: 'Un número y un símbolo', valid: /\d/.test(resetForm.nueva) && /[^A-Za-z0-9]/.test(resetForm.nueva) }
  ]

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateEmail(email)
    if (validationError) return addNotification({ title: 'Revisá el correo', message: validationError, type: 'error' })
    setSubmitting(true)
    try {
      await tryRecoverPassword(cleanText(email).toLowerCase(), tipoAcceso)
      setRequestSent(true)
    } catch (error) {
      addNotification({ title: 'No disponible', message: error.message, type: 'error' })
    } finally { setSubmitting(false) }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    const validationError = firstValidationError([validateEmail(email), validateMeaningfulText(resetForm.token, 'El enlace de recuperación', { ...FIELD_LIMITS.token, requireLetter: false }), validateStrongPassword(resetForm.nueva, 'La nueva contraseña')])
    if (validationError) return addNotification({ title: 'Revisá los datos', message: validationError, type: 'error' })
    if (resetForm.nueva !== resetForm.confirmar) return addNotification({ title: 'Las contraseñas no coinciden', message: 'Escribí la misma contraseña en ambos campos.', type: 'error' })
    setSubmitting(true)
    try {
      await resetPassword({ email: cleanText(email).toLowerCase(), token: cleanText(resetForm.token), passwordNueva: resetForm.nueva, confirmarPassword: resetForm.confirmar })
      setResetComplete(true)
      setResetForm((current) => ({ ...current, nueva: '', confirmar: '' }))
    } catch (error) {
      addNotification({ title: 'No se pudo cambiar la contraseña', message: error.message, type: 'error' })
    } finally { setSubmitting(false) }
  }

  return (
    <main className="recovery-page" style={{ backgroundImage: `linear-gradient(118deg, rgba(7, 35, 57, .9), rgba(8, 72, 82, .72)), url("${loginBackground}")` }}>
      <div className="recovery-glow recovery-glow-one" aria-hidden="true" /><div className="recovery-glow recovery-glow-two" aria-hidden="true" />
      <section className="recovery-shell" aria-labelledby="recovery-title">
        <aside className="recovery-aside">
          <img src={cospralLogo} alt="COSPRAL · Cooperativa de Agua y Luz" className="recovery-logo" />
          <div className="recovery-aside-copy"><span className="recovery-eyebrow"><ShieldCheck size={15} /> Recuperación segura</span><h2>Volvé a ingresar a tu cuenta en pocos pasos.</h2><p>Te acompañamos durante todo el proceso. Nunca te pediremos tu contraseña anterior por correo.</p></div>
          <div className="recovery-trust"><span><Clock3 size={17} /><strong>30 minutos</strong><small>de vigencia del enlace</small></span><span><LockKeyhole size={17} /><strong>Uso único</strong><small>para proteger tu cuenta</small></span></div>
        </aside>
        <div className="recovery-card">
          {resetComplete ? <RecoveryResult icon={<CheckCircle2 size={38} />} kicker="Cambio confirmado" title="Tu contraseña está lista"><p>Ya podés ingresar a COSPRAL con tu nueva contraseña.</p><Link to="/login" className="recovery-primary">Ir a iniciar sesión <ArrowRight size={18} /></Link></RecoveryResult>
            : requestSent ? <RecoveryResult icon={<Mail size={36} />} mail kicker="Solicitud enviada" title="Revisá tu correo"><p>Si <strong>{cleanText(email)}</strong> corresponde a una cuenta, recibirás un enlace para crear una contraseña nueva.</p><div className="recovery-tip"><Clock3 size={17} /><span>El enlace vence en 30 minutos. Revisá también Spam o Correo no deseado.</span></div><button type="button" className="recovery-secondary" onClick={() => setRequestSent(false)}>Usar otro correo</button><Link to="/login" className="recovery-text-link"><ArrowLeft size={16} /> Volver al inicio de sesión</Link></RecoveryResult>
              : hasRecoveryLink ? <ResetView email={email} setEmail={setEmail} form={resetForm} setForm={setResetForm} checks={passwordChecks} submitting={submitting} onSubmit={handleReset} />
                : <RequestView email={email} setEmail={setEmail} tipo={tipoAcceso} setTipo={setTipoAcceso} submitting={submitting} onSubmit={handleSubmit} />}
        </div>
      </section>
    </main>
  )
}

function RecoveryResult({ icon, mail = false, kicker, title, children }) {
  return <div className="recovery-result" role="status"><span className={`recovery-result-icon ${mail ? 'is-mail' : ''}`}>{icon}</span><p className="recovery-kicker">{kicker}</p><h1 id="recovery-title">{title}</h1>{children}</div>
}

function Heading({ reset = false }) {
  return <header className="recovery-heading"><span className="recovery-heading-icon"><KeyRound size={24} /></span><p className="recovery-kicker">{reset ? 'Último paso' : 'Recuperar acceso'}</p><h1 id="recovery-title">{reset ? 'Creá una contraseña nueva' : '¿Olvidaste tu contraseña?'}</h1><p>{reset ? 'Elegí una clave segura que no uses en otros servicios.' : 'Indicá qué cuenta querés recuperar y te enviaremos un enlace seguro.'}</p></header>
}

function RequestView({ email, setEmail, tipo, setTipo, submitting, onSubmit }) {
  return <><Heading /><form onSubmit={onSubmit} className="recovery-form"><fieldset><legend>Tipo de cuenta</legend><div className="recovery-account-options">{[{ type: 'Socio', Icon: UserRound, detail: 'Cuenta personal' }, { type: 'Empleado', Icon: BriefcaseBusiness, detail: 'Acceso laboral' }].map(({ type, Icon, detail }) => <button key={type} type="button" aria-pressed={tipo === type} className={tipo === type ? 'is-selected' : ''} onClick={() => setTipo(type)}><span><Icon size={18} /></span><span><strong>{type}</strong><small>{detail}</small></span><Check size={16} className="recovery-option-check" /></button>)}</div></fieldset><label htmlFor="recovery-request-email">Correo electrónico</label><div className="recovery-input-wrap"><Mail size={18} /><input id="recovery-request-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required minLength={FIELD_LIMITS.email.min} maxLength={FIELD_LIMITS.email.max} autoComplete="email" placeholder="nombre@correo.com" /></div><p className="recovery-privacy"><ShieldCheck size={15} /> Por seguridad, no indicaremos si el correo está registrado.</p><button type="submit" disabled={submitting} className="recovery-primary">{submitting ? <><Loader2 className="recovery-spin" size={18} /> Enviando…</> : <>Enviar enlace de recuperación <ArrowRight size={18} /></>}</button></form><Link to="/login" className="recovery-text-link"><ArrowLeft size={16} /> Volver al inicio de sesión</Link></>
}

function ResetView({ email, setEmail, form, setForm, checks, submitting, onSubmit }) {
  return <><Heading reset /><form onSubmit={onSubmit} className="recovery-form"><label htmlFor="recovery-email">Correo de la cuenta</label><div className="recovery-input-wrap"><Mail size={18} /><input id="recovery-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" maxLength={FIELD_LIMITS.email.max} placeholder="tu@email.com" /></div><label htmlFor="recovery-password-new">Nueva contraseña</label><PasswordInput id="recovery-password-new" label="nueva contraseña" value={form.nueva} onChange={(e) => setForm((current) => ({ ...current, nueva: e.target.value }))} required minLength={FIELD_LIMITS.password.min} maxLength={FIELD_LIMITS.password.max} autoComplete="new-password" placeholder="Ingresá tu nueva contraseña" /><div className="recovery-password-checks" aria-label="Requisitos de contraseña">{checks.map((check) => <span key={check.label} className={check.valid ? 'is-valid' : ''}><Check size={13} />{check.label}</span>)}</div><label htmlFor="recovery-password-confirm">Confirmar contraseña</label><PasswordInput id="recovery-password-confirm" label="confirmación de nueva contraseña" value={form.confirmar} onChange={(e) => setForm((current) => ({ ...current, confirmar: e.target.value }))} required minLength={FIELD_LIMITS.password.min} maxLength={FIELD_LIMITS.password.max} autoComplete="new-password" placeholder="Repetí la nueva contraseña" />{form.confirmar && <p className={`recovery-match ${form.nueva === form.confirmar ? 'is-valid' : ''}`}>{form.nueva === form.confirmar ? 'Las contraseñas coinciden' : 'Las contraseñas todavía no coinciden'}</p>}<button type="submit" disabled={submitting} className="recovery-primary">{submitting ? <><Loader2 className="recovery-spin" size={18} /> Guardando…</> : <>Guardar nueva contraseña <ArrowRight size={18} /></>}</button></form></>
}
