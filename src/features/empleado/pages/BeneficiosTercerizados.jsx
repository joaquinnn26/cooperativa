import React, { useCallback, useEffect, useState } from 'react'
import { apiLaboralExistente, descargarApi } from '@/utils/laboral.js'

const states = ['Recibida', 'EnRevision', 'NecesitaInformacion', 'Aprobada', 'Exportada', 'Finalizada', 'Rechazada', 'Cancelada']
const stateLabels = { Recibida: 'Recibida', EnRevision: 'En revisión', NecesitaInformacion: 'Falta información', Aprobada: 'Aprobada para enviar', Exportada: 'Enviada al prestador', Finalizada: 'Finalizada', Rechazada: 'Rechazada', Cancelada: 'Cancelada' }
const typeLabels = { SEPELIO: 'Sepelio', ORTOPEDIA: 'Ortopedia' }

export default function BeneficiosTercerizados() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [attachments, setAttachments] = useState({})
  const [histories, setHistories] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const url = `/beneficios/gestor/solicitudes${filter ? `?estado=${encodeURIComponent(filter)}` : ''}`
    setItems(await apiLaboralExistente(url))
  }, [filter])

  useEffect(() => { load().catch(e => setError(e.message)) }, [load])

  async function act(item, Accion) {
    let Motivo = ''
    let ReferenciaPrestador = ''
    let ResultadoPrestador = ''
    if (['PedirInformacion', 'Rechazar'].includes(Accion)) {
      Motivo = window.prompt(Accion === 'PedirInformacion' ? '¿Qué información falta?' : 'Motivo del rechazo:') || ''
      if (!Motivo.trim()) return
    }
    if (Accion === 'Finalizar') {
      ReferenciaPrestador = window.prompt('Referencia del prestador:') || ''
      if (!ReferenciaPrestador.trim()) return
      ResultadoPrestador = window.prompt('Resultado del servicio (atendido, coordinado, no realizado, etc.):') || ''
      if (!ResultadoPrestador.trim()) return
    }
    setBusy(true); setError(''); setNotice('')
    try {
      await apiLaboralExistente(`/beneficios/gestor/solicitudes/${item.idSolicitudBeneficio}/accion`, { method: 'POST', body: { Accion, Motivo, ReferenciaPrestador, ResultadoPrestador, Version: item.Version } })
      setNotice('Actualizamos el trámite y quedó registrado en el historial.'); await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function exportApproved() {
    setBusy(true); setError(''); setNotice('')
    try {
      const lote = await apiLaboralExistente('/beneficios/gestor/exportaciones', { method: 'POST' })
      await descargarApi(`/beneficios/gestor/exportaciones/${lote.idLote}/archivo`, lote.NombreArchivo)
      setNotice(`Se exportaron ${lote.Cantidad} solicitudes aprobadas. El archivo ${lote.NombreArchivo} quedó registrado.`); await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function showAttachments(item) {
    setError('')
    try {
      const data = await apiLaboralExistente(`/beneficios/gestor/solicitudes/${item.idSolicitudBeneficio}/adjuntos`)
      setAttachments(old => ({ ...old, [item.idSolicitudBeneficio]: data }))
    } catch (e) { setError(e.message) }
  }

  async function showHistory(item) {
    setError('')
    try { const history = await apiLaboralExistente(`/beneficios/solicitudes/${item.idSolicitudBeneficio}/historial`); setHistories(old => ({ ...old, [item.idSolicitudBeneficio]: history })) } catch (e) { setError(e.message) }
  }

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-cyan-800">Área Beneficios</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Sepelio y ortopedia</h1><p className="mt-2 max-w-3xl text-slate-600">Revisá solicitudes, pedí información y aprobá las que correspondan. Solo se exportan casos aprobados con consentimiento registrado.</p></div><button className="btn-primary" disabled={busy || !items.some(x => x.Estado === 'Aprobada')} onClick={exportApproved}>{busy ? 'Procesando…' : 'Exportar aprobadas al prestador'}</button></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    <section className="card space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Bandeja de solicitudes</h2><p className="text-sm text-slate-600">Los datos personales y adjuntos son confidenciales y se muestran solo al equipo autorizado.</p></div><label className="grid gap-1 text-sm">Estado<select className="input-field min-w-56" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos</option>{states.map(s => <option key={s} value={s}>{stateLabels[s]}</option>)}</select></label></div>
      {!items.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No hay trámites para este filtro.</p>}
      <div className="space-y-4">{items.map(item => <article key={item.idSolicitudBeneficio} className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{typeLabels[item.Tipo]} · solicitud #{item.idSolicitudBeneficio}</h3><p className="text-sm text-slate-600">Socio {item.NumeroSocio} · {item.Socio} · {new Date(item.FechaCreacionUtc).toLocaleString('es-AR')}</p></div><span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-950">{stateLabels[item.Estado] || item.Estado}</span></div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2"><p><b>Beneficiario:</b> {item.Beneficiario} · documento {item.DocumentoBeneficiario} · {item.Vinculo}</p><p><b>Contacto:</b> {item.TelefonoContacto}</p><p><b>Fecha requerida:</b> {item.FechaNecesidad ? new Date(`${item.FechaNecesidad}T12:00:00`).toLocaleDateString('es-AR') : 'Sin fecha indicada'}</p><p><b>Consentimiento:</b> {item.ConsentimientoCompartir ? `registrado el ${new Date(item.FechaConsentimientoUtc).toLocaleString('es-AR')}` : 'No registrado'}</p><p className="md:col-span-2"><b>Detalle:</b> {item.Detalle}</p>{item.RespuestaSocio && <p className="md:col-span-2"><b>Información del socio:</b> {item.RespuestaSocio}</p>}{item.MotivoDecision && <p className="md:col-span-2 rounded-lg bg-amber-50 p-3"><b>Nota al socio:</b> {item.MotivoDecision}</p>}{item.ReferenciaPrestador && <p><b>Referencia externa:</b> {item.ReferenciaPrestador}</p>}{item.ResultadoPrestador && <p><b>Resultado:</b> {item.ResultadoPrestador}</p>}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!attachments[item.idSolicitudBeneficio] && <button className="btn-secondary" onClick={() => showAttachments(item)}>Ver documentación</button>}
          {attachments[item.idSolicitudBeneficio]?.map(file => <button className="btn-secondary" key={file.idAdjunto} onClick={() => descargarApi(`/beneficios/adjuntos/${file.idAdjunto}`, `solicitud-${item.idSolicitudBeneficio}-${file.NombreArchivo}`)}>Descargar: {file.NombreArchivo}</button>)}
          {!histories[item.idSolicitudBeneficio] && <button className="btn-secondary" onClick={() => showHistory(item)}>Ver historial</button>}
          {item.Estado === 'Recibida' && <button className="btn-primary" disabled={busy} onClick={() => act(item, 'Iniciar')}>Iniciar revisión</button>}
          {item.Estado === 'EnRevision' && <><button className="btn-secondary" disabled={busy} onClick={() => act(item, 'PedirInformacion')}>Pedir información</button><button className="btn-secondary text-red-700" disabled={busy} onClick={() => act(item, 'Rechazar')}>Rechazar</button><button className="btn-primary" disabled={busy || !item.ConsentimientoCompartir} onClick={() => act(item, 'Aprobar')}>Aprobar</button></>}
          {item.Estado === 'Exportada' && <button className="btn-primary" disabled={busy} onClick={() => act(item, 'Finalizar')}>Registrar respuesta del prestador</button>}
        </div>
        {histories[item.idSolicitudBeneficio] && <ol className="mt-4 space-y-2 border-l-2 border-cyan-200 pl-4">{histories[item.idSolicitudBeneficio].map((entry, index) => <li key={`${entry.Accion}-${index}`} className="text-sm"><b>{stateLabels[entry.EstadoNuevo] || entry.Accion}</b> · {new Date(entry.FechaUtc).toLocaleString('es-AR')} · {entry.Responsable || 'Socio'}{entry.Motivo && <p className="text-slate-600">{entry.Motivo}</p>}</li>)}</ol>}
      </article>)}</div>
    </section>
  </main>
}
