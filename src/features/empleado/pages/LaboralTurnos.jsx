import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CalendarClock, Check, Clock3, Search, X } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { laboralApi, apiLaboralExistente } from '@/utils/laboral.js'
import { esEncargado } from '@/utils/laboralPermissions.js'
import { formatearFechaLarga } from '@/utils/turnosUtils.jsx'
import '../styles/TurnosAtencion.css'

function estaAbierto(estado) {
  const value = String(estado || '').toLowerCase()
  return value.startsWith('pendiente') || value.startsWith('propuest')
}

export default function LaboralTurnos() {
  const jefe = esEncargado(useAuthStore(s => s.areas), 'ADMINISTRACION')
  const [turnos, setTurnos] = useState([]), [slots, setSlots] = useState([]), [motivos, setMotivos] = useState([])
  const [q, setQ] = useState(''), [estado, setEstado] = useState('Activos'), [decision, setDecision] = useState(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0)
  const turnoEnRevision = useMemo(() => turnos.find(t => t.idTurno === decision?.idTurno), [turnos, decision])
  const turnosVisibles = useMemo(() => turnos.filter(t => {
    const abierto = estaAbierto(t.estado)
    const coincideEstado = estado === 'Todos' || (estado === 'Activos' ? abierto : !abierto)
    const texto = `${t.socioNombre || ''} ${t.fecha || ''} ${t.motivo || ''} ${t.estado || ''}`.toLowerCase()
    return coincideEstado && (!q.trim() || texto.includes(q.trim().toLowerCase()))
  }), [turnos, estado, q])

  useEffect(() => { const abort = new AbortController(); Promise.all([apiLaboralExistente('/admin/turnos', { signal: abort.signal }), apiLaboralExistente('/turnos/disponibilidad', { signal: abort.signal }), jefe ? laboralApi('/motivos?area=ADMINISTRACION', { signal: abort.signal }) : []]).then(([t, s, m]) => { setTurnos(t); setSlots(s); setMotivos(m.filter(x => x.Accion === 'Rechazar')) }).catch(e => { if (!abort.signal.aborted) setError(e.message) }); return () => abort.abort() }, [revision, jefe])
  useEffect(() => { if (!decision) return; const onEscape = e => { if (e.key === 'Escape' && !busy) setDecision(null) }; window.addEventListener('keydown', onEscape); return () => window.removeEventListener('keydown', onEscape) }, [decision, busy])
  async function decide(e) { e.preventDefault(); setBusy(true); setError(''); try { await apiLaboralExistente(`/admin/turnos/${decision.idTurno}`, { method: 'PUT', body: { ...decision, EstadoId: Number(decision.EstadoId), idMotivo: Number(decision.idMotivo), ObservacionAdmin: decision.EstadoId === '4' ? motivos.find(m => m.idMotivo === Number(decision.idMotivo))?.Nombre : decision.ObservacionAdmin } }); setDecision(null); setRevision(v => v + 1) } catch (e) { setError(e.message) } finally { setBusy(false) } }

  return <div className="atencion-turnos space-y-5">
    <Link className="atencion-back-link" to="/empleado/atencion"><ArrowLeft size={17}/> Volver a atención y trámites</Link>
    <header className="atencion-hero"><div><span className="atencion-eyebrow">Administración · Agenda</span><h1>Gestión de turnos</h1><p>Revisá las solicitudes de visita, aprobá el horario o enviá una propuesta alternativa. Los reclamos se gestionan en Atención y trámites.</p></div><div className="atencion-hero-icon"><CalendarClock size={34}/></div></header>
    <div className="atencion-turn-summary"><div><span>Activos por revisar o responder</span><strong>{turnos.filter(t => estaAbierto(t.estado)).length}</strong></div><div><span>Solicitudes totales</span><strong>{turnos.length}</strong></div><p>Una solicitud de turno reserva tiempo de atención; no representa un reclamo ni lo reemplaza.</p></div>
    {error && <p role="alert" className="atencion-error"><AlertCircle size={18}/>{error}</p>}
    <section className="atencion-panel">
      <div className="atencion-section-title"><span className="atencion-section-icon"><CalendarClock size={19}/></span><div><p className="atencion-step">AGENDA DE ATENCIÓN</p><h2>Solicitudes de turno</h2><p>El estado y la respuesta se notifican al socio en su panel.</p></div></div>
      <div className="atencion-turn-tools"><label className="atencion-search"><Search size={18}/><input aria-label="Buscar turnos" placeholder="Buscar por socio, fecha o motivo" value={q} onChange={e => setQ(e.target.value)}/></label><div className="atencion-tabs" role="group" aria-label="Estado de turnos">{['Activos', 'Resueltos', 'Todos'].map(option => <button type="button" key={option} aria-pressed={estado === option} className={estado === option ? 'is-selected' : ''} onClick={() => setEstado(option)}>{option}</button>)}</div></div>
      {turnosVisibles.length ? <div className="atencion-turn-list">{turnosVisibles.map(t => { const open = estaAbierto(t.estado); return <article className="atencion-turn" key={t.idTurno}><div className="atencion-turn-icon"><Clock3 size={19}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3>{t.socioNombre}</h3><span className={`atencion-tag ${open ? 'is-active' : ''}`}>{t.estado}</span></div><p className="atencion-turn-date">{String(t.fecha).slice(0, 10)} · {t.hora} hs</p><p className="atencion-turn-reason">Motivo de la visita: {t.motivo}</p>{t.fechaPropuesta && <p className="atencion-turn-note">Alternativa propuesta: {String(t.fechaPropuesta).slice(0, 10)} · {t.horaPropuesta} hs</p>}{t.observacionAdmin && <p className="atencion-turn-note">Nota: {t.observacionAdmin}</p>}</div>{jefe && open && <button type="button" className="atencion-review" onClick={() => { setError(''); setDecision({ idTurno: t.idTurno, EstadoId: '2', idMotivo: '', ObservacionAdmin: '', FechaPropuesta: '', HoraPropuesta: '' }) }}>Revisar solicitud<Check size={15}/></button>}</article>})}</div> : <div className="atencion-empty"><CalendarClock size={25}/><strong>{q ? 'No encontramos turnos con esa búsqueda' : 'No hay turnos en esta lista'}</strong><span>{q ? 'Probá con otro nombre o motivo.' : 'Las solicitudes aparecerán aquí cuando un socio pida una visita.'}</span></div>}
    </section>
    {decision && <div className="atencion-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setDecision(null) }}><form role="dialog" aria-modal="true" aria-labelledby="decision-title" className="atencion-modal" onSubmit={decide}>
      <header className="atencion-modal-head"><div className="atencion-modal-icon"><CalendarClock size={22}/></div><div className="min-w-0 flex-1"><p>AGENDA · TURNO #{decision.idTurno}</p><h2 id="decision-title">Revisar solicitud de turno</h2></div><button type="button" className="atencion-close" aria-label="Cerrar" disabled={busy} onClick={() => setDecision(null)}><X size={20}/></button></header>
      {turnoEnRevision && <div className="atencion-context"><strong>{turnoEnRevision.socioNombre}</strong><span>{String(turnoEnRevision.fecha).slice(0, 10)} · {turnoEnRevision.hora} hs</span><p>Motivo de visita: {turnoEnRevision.motivo}</p></div>}
      <label className="atencion-label">Qué querés hacer<select className="input-field" value={decision.EstadoId} onChange={e => setDecision(d => ({ ...d, EstadoId: e.target.value, ObservacionAdmin: '', idMotivo: '', FechaPropuesta: '', HoraPropuesta: '' }))}><option value="2">Aprobar el horario solicitado</option><option value="3">Proponer otro horario disponible</option><option value="4">Rechazar la solicitud con un motivo</option></select></label>
      {decision.EstadoId === '4' ? <label className="atencion-label">Motivo del rechazo<select required className="input-field" value={decision.idMotivo} onChange={e => setDecision(d => ({ ...d, idMotivo: e.target.value }))}><option value="">Elegí el motivo</option>{motivos.map(m => <option key={m.idMotivo} value={m.idMotivo}>{m.Nombre}</option>)}</select></label> : <label className="atencion-label">Mensaje para el socio <span className="font-normal text-slate-400">(opcional)</span><textarea className="input-field min-h-24" maxLength={500} value={decision.ObservacionAdmin} onChange={e => setDecision(d => ({ ...d, ObservacionAdmin: e.target.value }))} placeholder="Agregá una aclaración breve"/></label>}
      {decision.EstadoId === '3' && <div className="rounded-2xl bg-cyan-50/70 p-4"><p className="mb-3 text-sm font-semibold text-cyan-950">Elegí una alternativa libre. El socio deberá aceptarla para confirmar el turno.</p><div className="grid gap-4 sm:grid-cols-2"><label className="atencion-label">Fecha disponible<select className="input-field" required value={decision.FechaPropuesta} onChange={e => setDecision(d => ({ ...d, FechaPropuesta: e.target.value, HoraPropuesta: '' }))}><option value="">Seleccioná fecha</option>{slots.filter(s => s.disponible && s.horarios?.length).map(s => <option key={s.fecha} value={s.fecha}>{formatearFechaLarga(s.fecha)} · {s.horarios.length} horarios</option>)}</select></label><label className="atencion-label">Horario disponible<select className="input-field" required disabled={!decision.FechaPropuesta} value={decision.HoraPropuesta} onChange={e => setDecision(d => ({ ...d, HoraPropuesta: e.target.value }))}><option value="">Seleccioná horario</option>{(slots.find(s => s.fecha === decision.FechaPropuesta)?.horarios || []).map(h => <option key={h} value={h}>{h}</option>)}</select></label></div>{!slots.some(s => s.disponible && s.horarios?.length) && <p className="mt-3 text-sm text-amber-800">No hay fechas ni horarios disponibles para proponer ahora.</p>}</div>}
      {error && <p role="alert" className="atencion-error"><AlertCircle size={18}/>{error}</p>}
      <footer className="atencion-modal-actions"><button type="button" className="atencion-cancel" disabled={busy} onClick={() => setDecision(null)}>Volver</button><button className="atencion-confirm" disabled={busy}>{busy ? 'Guardando…' : <><Check size={17}/>Guardar decisión</>}</button></footer>
    </form></div>}
  </div>
}
