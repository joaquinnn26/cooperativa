import React, { useCallback, useEffect, useState } from 'react'
import { apiLaboralExistente, archivoPayload } from '@/utils/laboral.js'

const labels = { SEPELIO: 'Sepelio', ORTOPEDIA: 'Ortopedia' }
const statusLabels = { Recibida: 'Recibida', EnRevision: 'En revisión', NecesitaInformacion: 'Falta información', Aprobada: 'Aprobada', Rechazada: 'Rechazada', Exportada: 'Enviada al prestador', Finalizada: 'Finalizada', Cancelada: 'Cancelada' }

export default function SocioBeneficios() {
  const [eligibilidad, setElegibilidad] = useState(null)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ Tipo: 'SEPELIO', Beneficiario: '', DocumentoBeneficiario: '', Vinculo: '', TelefonoContacto: '', Detalle: '', FechaNecesidad: '', ConsentimientoCompartir: false })
  const [adjunto, setAdjunto] = useState(null)
  const [respuesta, setRespuesta] = useState({})
  const [archivoRespuesta, setArchivoRespuesta] = useState({})
  const [histories, setHistories] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const [gate, requests] = await Promise.all([
      apiLaboralExistente('/beneficios/elegibilidad'),
      apiLaboralExistente('/beneficios/mis-solicitudes')
    ])
    setElegibilidad(gate)
    setItems(requests || [])
  }, [])

  useEffect(() => { load().catch(e => setError(e.message)) }, [load])

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const payload = { ...form, Adjunto: adjunto ? await archivoPayload(adjunto) : null }
      await apiLaboralExistente('/beneficios/solicitudes', { method: 'POST', body: payload })
      setForm({ Tipo: 'SEPELIO', Beneficiario: '', DocumentoBeneficiario: '', Vinculo: '', TelefonoContacto: '', Detalle: '', FechaNecesidad: '', ConsentimientoCompartir: false })
      setAdjunto(null); setNotice('Recibimos tu solicitud. Podés consultar su avance en esta página.'); await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function sendInfo(item) {
    const text = respuesta[item.idSolicitudBeneficio]?.trim()
    if (!text) { setError('Contanos la información que te solicitaron antes de responder.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      const file = archivoRespuesta[item.idSolicitudBeneficio]
      await apiLaboralExistente(`/beneficios/mis-solicitudes/${item.idSolicitudBeneficio}/responder`, { method: 'POST', body: { Respuesta: text, Adjunto: file ? await archivoPayload(file) : null } })
      setRespuesta(old => ({ ...old, [item.idSolicitudBeneficio]: '' })); setArchivoRespuesta(old => ({ ...old, [item.idSolicitudBeneficio]: null })); setNotice('Enviamos la información al equipo de Beneficios.'); await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function cancel(id) {
    if (!window.confirm('¿Querés cancelar esta solicitud?')) return
    setBusy(true); setError('')
    try { await apiLaboralExistente(`/beneficios/mis-solicitudes/${id}/cancelar`, { method: 'POST' }); await load() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function showHistory(id) {
    setError('')
    try { const history = await apiLaboralExistente(`/beneficios/solicitudes/${id}/historial`); setHistories(old => ({ ...old, [id]: history })) } catch (e) { setError(e.message) }
  }

  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-cyan-800">Servicios para socios</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Sepelio y ortopedia</h1><p className="mt-2 max-w-3xl text-slate-600">Iniciá una solicitud cubierta por el servicio eléctrico y seguí su revisión. El equipo de Beneficios comparte los datos con el prestador solo con tu autorización.</p></header>
    {eligibilidad && <section className={`rounded-2xl border p-4 ${eligibilidad.Elegible ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}><h2 className="font-semibold">{eligibilidad.Elegible ? 'Podés solicitar estos beneficios' : 'Revisá tu cobertura'}</h2><p className="mt-1 text-sm">{eligibilidad.Elegible ? 'La conexión eléctrica y la última factura registrada cumplen las condiciones del portal.' : eligibilidad.Criterio}</p></section>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {eligibilidad?.Elegible && <form onSubmit={submit} className="card space-y-4">
      <div><h2 className="text-xl font-semibold">Nueva solicitud</h2><p className="text-sm text-slate-600">Completá los datos de la persona que recibirá el servicio.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Beneficio<select className="input-field" value={form.Tipo} onChange={e => setForm({ ...form, Tipo: e.target.value })}><option value="SEPELIO">Sepelio</option><option value="ORTOPEDIA">Ortopedia</option></select></label>
        <label className="grid gap-1 text-sm font-medium">Beneficiario<input className="input-field" maxLength={150} required value={form.Beneficiario} onChange={e => setForm({ ...form, Beneficiario: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">Documento del beneficiario<input className="input-field" maxLength={20} required value={form.DocumentoBeneficiario} onChange={e => setForm({ ...form, DocumentoBeneficiario: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">Vínculo con el socio<input className="input-field" maxLength={60} required placeholder="Titular, familiar…" value={form.Vinculo} onChange={e => setForm({ ...form, Vinculo: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">Teléfono de contacto<input className="input-field" type="tel" maxLength={40} required value={form.TelefonoContacto} onChange={e => setForm({ ...form, TelefonoContacto: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">Fecha en que se necesita (si aplica)<input className="input-field" type="date" value={form.FechaNecesidad} onChange={e => setForm({ ...form, FechaNecesidad: e.target.value })} /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Contanos qué necesitás<textarea className="input-field min-h-28" maxLength={1500} required value={form.Detalle} onChange={e => setForm({ ...form, Detalle: e.target.value })} /></label>
      <label className="grid gap-1 text-sm font-medium">Documentación de respaldo (PDF, PNG o JPEG, hasta 2 MB)<input className="input-field" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => setAdjunto(e.target.files?.[0] || null)} /></label>
      <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm"><input className="mt-1" type="checkbox" checked={form.ConsentimientoCompartir} onChange={e => setForm({ ...form, ConsentimientoCompartir: e.target.checked })} /><span>Autorizo a COSPRAL a compartir los datos que ingresé y los adjuntos de este trámite con la empresa prestadora de {labels[form.Tipo].toLowerCase()} para gestionar la solicitud. Esta autorización queda registrada.</span></label>
      <button className="btn-primary" disabled={busy || !form.ConsentimientoCompartir}>{busy ? 'Enviando…' : 'Enviar solicitud'}</button>
    </form>}
    <section className="card space-y-4"><div><h2 className="text-xl font-semibold">Mis solicitudes</h2><p className="text-sm text-slate-600">La cooperativa te avisará si necesita más datos.</p></div>
      {!items.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Todavía no tenés solicitudes de sepelio u ortopedia.</p>}
      {items.map(item => <article key={item.idSolicitudBeneficio} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{labels[item.Tipo]} · {item.Beneficiario}</h3><span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-900">{statusLabels[item.Estado] || item.Estado}</span></div><p className="mt-1 text-sm text-slate-600">Solicitud #{item.idSolicitudBeneficio} · {new Date(item.FechaCreacionUtc).toLocaleDateString('es-AR')}</p>
        {item.MotivoDecision && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">{item.MotivoDecision}</p>}{item.RespuestaSocio && <p className="mt-2 text-sm text-slate-600">Tu respuesta: {item.RespuestaSocio}</p>}{item.ReferenciaPrestador && <p className="mt-2 text-sm">Referencia del prestador: {item.ReferenciaPrestador}</p>}{item.ResultadoPrestador && <p className="mt-2 text-sm">Resultado: {item.ResultadoPrestador}</p>}
        {item.Estado === 'NecesitaInformacion' && <div className="mt-4 grid gap-3"><textarea className="input-field min-h-20" placeholder="Escribí la información solicitada" value={respuesta[item.idSolicitudBeneficio] || ''} onChange={e => setRespuesta(old => ({ ...old, [item.idSolicitudBeneficio]: e.target.value }))} /><input className="input-field" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => setArchivoRespuesta(old => ({ ...old, [item.idSolicitudBeneficio]: e.target.files?.[0] || null }))} /><button className="btn-primary justify-self-start" disabled={busy} onClick={() => sendInfo(item)}>Enviar información</button></div>}
        {['Recibida', 'EnRevision', 'NecesitaInformacion', 'Aprobada'].includes(item.Estado) && <button className="mt-3 text-sm font-semibold text-red-700 underline" disabled={busy} onClick={() => cancel(item.idSolicitudBeneficio)}>Cancelar solicitud</button>}
        {!histories[item.idSolicitudBeneficio] && <button className="mt-3 block text-sm font-semibold text-cyan-800 underline" onClick={() => showHistory(item.idSolicitudBeneficio)}>Ver historial</button>}
        {histories[item.idSolicitudBeneficio] && <ol className="mt-4 space-y-2 border-l-2 border-cyan-200 pl-4">{histories[item.idSolicitudBeneficio].map((entry, index) => <li key={`${entry.Accion}-${index}`} className="text-sm"><b>{statusLabels[entry.EstadoNuevo] || entry.Accion}</b> · {new Date(entry.FechaUtc).toLocaleString('es-AR')}{entry.Motivo && <p className="text-slate-600">{entry.Motivo}</p>}</li>)}</ol>}
      </article>)}
    </section>
  </main>
}
