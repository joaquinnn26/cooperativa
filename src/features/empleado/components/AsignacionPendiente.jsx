import React, { useEffect, useState } from 'react'
import { Building2, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'

export default function AsignacionPendiente() {
  const nombre = useAuthStore(state => state.nombre)
  const refresh = useAuthStore(state => state.refreshLaboralProfile)
  const [revision, setRevision] = useState(0)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const abort = new AbortController()
    let running = false
    const check = async () => {
      if (running || abort.signal.aborted || document.visibilityState === 'hidden') return
      running = true
      setChecking(true)
      setError('')
      try {
        await refresh({ signal: abort.signal })
        if (!abort.signal.aborted) setChecked(true)
      } catch (e) {
        if (!abort.signal.aborted) setError(e.message)
      } finally {
        running = false
        if (!abort.signal.aborted) setChecking(false)
      }
    }
    check()
    const timer = window.setInterval(check, 30000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      abort.abort()
      window.clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [refresh, revision])

  return <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="bg-gradient-to-br from-blue-950 to-blue-800 px-6 py-9 text-white sm:px-9">
      <span className="mb-5 inline-flex rounded-2xl bg-white/10 p-3"><Building2 size={30} aria-hidden="true" /></span>
      <p className="text-sm text-blue-100">{nombre ? `Hola, ${nombre}` : 'Bienvenido a tu cuenta laboral'}</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Aún no tenés un área y un puesto asignados</h1>
      <p className="mt-3 text-sm leading-6 text-blue-100">Tu usuario ya está creado y podés ingresar. Administración debe asignarte un área y un puesto para habilitar tu espacio de trabajo.</p>
    </div>
    <div className="space-y-6 p-6 sm:p-9">
      <ol className="space-y-5 text-sm">
        <li className="flex items-start gap-3"><CheckCircle2 className="shrink-0 text-emerald-600" size={22} /><div><strong>Cuenta laboral activa</strong><p className="mt-1 text-slate-500">El alta del empleado se completó.</p></div></li>
        <li className="flex items-start gap-3"><Clock3 className="shrink-0 text-amber-600" size={22} /><div><strong>Área y puesto pendientes</strong><p className="mt-1 text-slate-500">Cuando esté lista, aparecerá tu vista según el área y el puesto asignados.</p></div></li>
      </ol>
      <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Esta pantalla consulta tu asignación automáticamente. No necesitás crear otra cuenta ni volver a iniciar sesión.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-4"><button type="button" disabled={checking} onClick={() => setRevision(value => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"><RefreshCw size={16} />{checking ? 'Consultando…' : 'Consultar mi asignación'}</button><p role="status" className="text-xs text-slate-500">{!checking && !error && checked ? 'Por ahora, tu asignación sigue pendiente.' : ''}</p></div>
    </div>
  </section>
}
