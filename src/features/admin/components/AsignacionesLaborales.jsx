import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, History, Plus, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react'
import { laboralApi } from '@/utils/laboral.js'
import { assignmentPayload } from '@/utils/laboralAssignment.js'
import '../pages/AdminOrganizacionLaboral.css'

const reasons = ['Asignación inicial', 'Reorganización interna', 'Cambio de responsabilidades', 'Cobertura temporal', 'Corrección de asignación', 'Revocación por cambio de puesto']
const initials = name => String(name).split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()
const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function AssignmentDialog({ title, close, busy, children }) {
  const ref = useRef(null)
  useEffect(() => { const old = document.activeElement; ref.current?.focus(); return () => old?.focus() }, [])
  return <div className="org-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) close() }}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="assignment-title" className="org-dialog" onKeyDown={e => {
    if (e.key === 'Escape' && !busy) close()
    if (e.key !== 'Tab') return
    const controls = [...ref.current.querySelectorAll('button,input,select')].filter(el => !el.matches(':disabled'))
    if (!controls.length) { e.preventDefault(); return }
    const first = controls[0], last = controls[controls.length - 1]
    if (e.shiftKey && [first, ref.current].includes(document.activeElement)) { e.preventDefault(); last.focus() }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }}><div className="org-section-heading"><h2 id="assignment-title">{title}</h2><button type="button" aria-label="Cerrar" disabled={busy} onClick={close}><X size={20} /></button></div>{children}</section></div>
}

export default function AsignacionesLaborales() {
  const [data, setData] = useState(null), [area, setArea] = useState('ADMINISTRACION')
  const [revision, setRevision] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [search, setSearch] = useState('')
  const [modal, setModal] = useState(null), [form, setForm] = useState({})
  const [params, setParams] = useSearchParams()
  const requested = params.get('empleado')
  useEffect(() => {
    const abort = new AbortController(); setLoading(true)
    laboralApi('/configuracion', { signal: abort.signal }).then(value => {
      if (abort.signal.aborted) return
      if (!Array.isArray(value.puestos)) throw new Error('La API necesita la actualización de asignación de área y puesto.')
      setData(value)
      setArea(current => value.areas.some(a => a.Codigo === current) ? current : value.areas[0]?.Codigo || '')
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [revision])
  const reload = () => { setError(''); setRevision(r => r + 1) }
  const field = (key, value) => setForm(current => ({ ...current, [key]: value, ...(key === 'Area' ? { Puesto: '', ReemplazarEncargado: false, ConfirmarTraslado: false } : {}), ...(key === 'idEmpleado' || key === 'Puesto' ? { ReemplazarEncargado: false, ConfirmarTraslado: false } : {}) }))
  const close = () => { if (!busy) { setModal(null); setError('') } }
  if (!data) return <div className="org-page"><div className="org-empty"><Building2 size={30} /><p role={error ? 'alert' : 'status'}>{error || 'Cargando áreas y puestos…'}</p>{error && <button className="org-button" disabled={loading} onClick={reload}>Reintentar</button>}</div></div>
  const current = id => data.miembros.find(m => String(m.idEmpleado) === String(id) && !m.HastaUtc)
  const employee = id => data.empleados.find(e => String(e.idEmpleado) === String(id))
  const name = id => employee(id)?.Nombre || `Empleado ${id}`
  const position = member => data.puestos.find(p => p.Area === member?.Area && p.Codigo === member?.Puesto)
  const areaRow = data.areas.find(a => a.Codigo === area)
  const members = data.miembros.filter(m => m.Area === area && !m.HastaUtc)
  const leader = data.encargados.find(m => m.Area === area && !m.HastaUtc)
  const pending = data.empleados.filter(e => e.Activo && !current(e.idEmpleado))
  const assignable = data.empleados.filter(e => e.Activo && (!current(e.idEmpleado) || current(e.idEmpleado).Area === area) && e.idEmpleado !== leader?.idEmpleado)
  const isManagement = area === 'GERENCIA'
  const visible = members.filter(m => normalize(name(m.idEmpleado)).includes(normalize(search)))
  const highlighted = employee(requested)
  const selected = employee(form.idEmpleado)
  const previous = current(form.idEmpleado)
  const destination = data.areas.find(a => a.Codigo === form.Area)
  const selectedPosition = data.puestos.find(p => p.Area === form.Area && p.Codigo === form.Puesto)
  const destinationLeader = data.encargados.find(m => m.Area === form.Area && !m.HastaUtc)
  const transfer = previous && (previous.Area !== form.Area || previous.Puesto !== form.Puesto)
  const replace = selectedPosition?.EsEncargado && destinationLeader && destinationLeader.idEmpleado !== selected?.idEmpleado
  const history = data.encargados.filter(m => m.Area === area)
  const open = (type, id = '', targetPosition = '') => {
    const assignment = current(id)
    setError('')
    setForm({ idEmpleado: String(id), Area: type === 'cambiar' ? assignment?.Area || area : area, Puesto: targetPosition || (type === 'cambiar' ? assignment?.Puesto || '' : ''), Motivo: '', ConfirmarTraslado: false, ReemplazarEncargado: false })
    setModal(type)
  }
  async function submit(event) {
    event.preventDefault()
    if (busy || loading) return
    setError('')
    let payload
    try {
      if (modal === 'finalizar') {
        if (!form.Motivo) throw new Error('Seleccioná el motivo del cambio.')
        payload = { idEmpleado: selected.idEmpleado, Version: selected.Version, Motivo: form.Motivo }
      } else payload = assignmentPayload(data, form)
    } catch (e) { setError(e.message); return }
    setBusy(true)
    try {
      const result = await laboralApi(modal === 'finalizar' ? '/asignacion/finalizar' : '/asignacion', { method: 'POST', body: payload })
      setNotice(result.mensaje); setModal(null); setArea(form.Area); setRevision(r => r + 1)
      if (requested === String(selected.idEmpleado)) { const next = new URLSearchParams(params); next.delete('empleado'); setParams(next, { replace: true }) }
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const disabled = loading || busy
  return <div className="org-page">
    <header className="org-hero"><div><Link to="/admin" className="org-back"><ArrowLeft size={14} /> Administración</Link><span className="org-eyebrow">PERSONAS Y EQUIPOS</span><h1>Organización laboral</h1><p>Una persona, un área y un puesto.<br />Los accesos se configuran automáticamente.</p></div><div className="org-hero-side"><div className="org-hero-symbol"><Users size={45} /></div><Link to="/admin/empleados">Alta de empleados <Plus size={16} /></Link></div></header>
    {error && !modal && <div className="org-notice org-error" role="alert"><span>{error}</span><button className="org-button" disabled={disabled} onClick={reload}>Actualizar</button></div>}
    {notice && <div className="org-notice org-success" role="status"><CheckCircle2 size={18} /><span>{notice}</span></div>}
    <section className="org-setup"><div className="org-section-heading"><div><span className="org-eyebrow">EL FLUJO DE ALTA</span><h2>Dos pasos, una sola configuración</h2></div><Link className="org-text-link" to="/admin/empleados">Gestionar empleados <ArrowRight size={15} /></Link></div><div className="org-steps" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}><div className="org-step"><span className="org-step-number">1</span><span><strong>Crear empleado y cuenta</strong><small>Puede ingresar, pero queda sin cargo ni área.</small></span></div><div className="org-step"><span className="org-step-number">2</span><span><strong>Asignar área y puesto</strong><small>Se habilitan su vista y sus tareas automáticamente.</small></span></div></div></section>
    {highlighted?.Activo && <div className="org-notice org-success"><span><strong>{highlighted.Nombre}</strong> · {current(highlighted.idEmpleado) ? 'Ya tiene una asignación; podés cambiar su puesto o trasladarlo.' : 'Está pendiente de área y puesto.'}</span><button className="org-button org-primary" disabled={disabled} onClick={() => open(current(highlighted.idEmpleado) ? 'cambiar' : 'asignar', highlighted.idEmpleado)}>{current(highlighted.idEmpleado) ? 'Revisar asignación' : 'Asignar área y puesto'}</button></div>}
    <section><div className="org-section-heading"><div><span className="org-eyebrow">ELEGÍ EL ÁREA</span><h2>Equipos de la cooperativa</h2></div><button className="org-button" disabled={disabled} onClick={reload}><RefreshCw size={15} />Actualizar</button></div><div className="org-area-grid">{data.areas.map(a => { const count = data.miembros.filter(m => m.Area === a.Codigo && !m.HastaUtc).length; return <button key={a.Codigo} type="button" disabled={disabled} aria-pressed={area === a.Codigo} className={`org-area-choice ${area === a.Codigo ? 'is-selected' : ''}`} onClick={() => { setArea(a.Codigo); setSearch('') }}><div><span className={`org-area-icon org-tone-${a.Codigo.toLowerCase()}`}><Building2 size={21} /></span>{area === a.Codigo && <CheckCircle2 size={16} />}</div><strong>{a.Nombre}</strong><small>{count} integrante{count !== 1 ? 's' : ''}</small><span className="org-area-state">{a.Codigo === 'GERENCIA' ? 'Responsable: gerente' : data.encargados.some(m => m.Area === a.Codigo && !m.HastaUtc) ? 'Con encargado' : 'Sin encargado'}</span></button> })}</div></section>
    {areaRow && <div key={area} className="org-workspace">
      <section className={`org-leader ${!isManagement && !leader ? 'is-pending' : ''}`}><div className="org-leader-info"><span className="org-leader-avatar"><ShieldCheck size={25} /></span><div><span className="org-eyebrow">{isManagement ? 'GERENCIA' : 'RESPONSABLE DEL ÁREA'}</span><h3>{isManagement ? members.length ? name(members[0].idEmpleado) : 'Gerente pendiente de asignación' : leader ? name(leader.idEmpleado) : 'Sin encargado asignado'}</h3><p>{isManagement ? 'El gerente es el responsable. Esta área no requiere un encargado adicional.' : 'El puesto de encargado incluye la coordinación y revisión del trabajo.'}</p></div></div>{!isManagement && <button className="org-button" disabled={disabled || !assignable.length} onClick={() => open('encargado', '', 'ENCARGADO')}>{leader ? 'Cambiar encargado' : 'Asignar encargado'}</button>}</section>
      {area === 'GAS' && <p className="org-notice org-warning">Podés asignar puestos. Las operaciones del convenio todavía están pendientes de definición.</p>}
      <section className="org-team"><div className="org-section-heading"><div><h2>{areaRow.Nombre} <span className="org-count">{members.length}</span></h2><p>El puesto determina las herramientas de cada empleado.</p></div><button className="org-button org-primary" disabled={disabled || !pending.length} onClick={() => open('asignar')}><Plus size={16} />Asignar empleado</button></div><label className="org-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar integrante" placeholder="Buscar en este equipo…" /></label><div className="org-member-grid" style={{ marginTop: 14 }}>{visible.map(m => { const puesto = position(m); return <article key={m.idEmpleadoArea} className="org-member-card"><div className="org-member-heading"><span className="org-avatar">{initials(name(m.idEmpleado))}</span><div><h3>{name(m.idEmpleado)}</h3><p>{puesto?.Nombre || employee(m.idEmpleado)?.Cargo || 'Puesto pendiente'}</p></div>{leader?.idEmpleado === m.idEmpleado && <span className="org-leader-badge">Encargado</span>}</div><div className="org-member-functions"><span className="org-eyebrow">PUESTO EN {areaRow.Nombre.toUpperCase()}</span><p className="org-muted">{puesto ? `Accesos configurados para ${puesto.Nombre.toLowerCase()}.` : 'Asignación anterior: revisá el puesto para unificar cargo y permisos.'}</p></div><button className="org-add-function" disabled={disabled} onClick={() => open('cambiar', m.idEmpleado)}>Cambiar puesto o trasladar de área <ArrowRight size={14} /></button><footer><span>Desde {new Date(m.DesdeUtc).toLocaleDateString('es-AR')}</span><button disabled={disabled} onClick={() => open('finalizar', m.idEmpleado)}>Finalizar asignación</button></footer></article> })}</div>{!visible.length && <div className="org-empty"><Users size={30} /><h3>{members.length ? 'Sin resultados para esta búsqueda' : 'Todavía no hay integrantes'}</h3><p>Asigná un empleado pendiente con un puesto válido para esta área.</p></div>}</section>
      {!isManagement && <details className="org-history"><summary><span><History size={18} />Historial de encargados <small>{history.length}</small></span></summary><div className="org-history-content">{history.map(h => <article key={h.idEncargadoArea}><span className={`org-history-dot ${!h.HastaUtc ? 'is-current' : ''}`} /><div><strong>{name(h.idEmpleado)}</strong><p>{new Date(h.DesdeUtc).toLocaleDateString('es-AR')} → {h.HastaUtc ? new Date(h.HastaUtc).toLocaleDateString('es-AR') : 'Actualidad'}</p><small>{h.Motivo}</small></div></article>)}{!history.length && <p className="org-muted">Aún no hay designaciones.</p>}</div></details>}
    </div>}
    <section className="org-onboarding"><div className="org-section-heading"><div><h2>Pendientes de asignación · {pending.length}</h2><p>Estas personas pueden iniciar sesión, pero aún necesitan un área y un puesto.</p></div></div><div className="org-unassigned">{pending.map(e => <div key={e.idEmpleado}><span className="org-avatar">{initials(e.Nombre)}</span><strong>{e.Nombre}</strong><button className="org-button" disabled={disabled || !areaRow} onClick={() => open('asignar', e.idEmpleado)}>Asignar área y puesto <Plus size={14} /></button></div>)}{!pending.length && <p className="org-muted">Todos los empleados activos tienen un área asignada.</p>}</div></section>
    {modal && <AssignmentDialog title={modal === 'finalizar' ? 'Finalizar asignación' : modal === 'encargado' ? 'Designar encargado' : modal === 'cambiar' ? 'Cambiar área o puesto' : 'Asignar área y puesto'} close={close} busy={busy}><form className="space-y-4" onSubmit={submit}>
      {error && <p role="alert" className="org-notice org-error">{error}</p>}
      <fieldset disabled={disabled} className="space-y-4">
        {modal === 'finalizar' ? <p className="org-modal-description"><strong>{name(form.idEmpleado)}</strong> quedará sin área ni cargo y verá la pantalla de asignación pendiente. Su cuenta y el historial se conservan.</p> : <>
          {modal === 'cambiar' || form.idEmpleado && modal !== 'encargado' ? <p className="org-modal-context">Empleado <strong>{name(form.idEmpleado)}</strong></p> : <label className="block">Empleado<select required className="input-field mt-1" value={form.idEmpleado} onChange={e => field('idEmpleado', e.target.value)}><option value="">Seleccionar empleado</option>{(modal === 'encargado' ? assignable : pending).map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{e.Nombre}{current(e.idEmpleado) ? ' · integrante del área' : ''}</option>)}</select></label>}
          <label className="block">Área<select required disabled={modal === 'encargado' || disabled} className="input-field mt-1" value={form.Area} onChange={e => field('Area', e.target.value)}>{data.areas.map(a => <option key={a.Codigo} value={a.Codigo}>{a.Nombre}</option>)}</select></label>
          <label className="block">Puesto<select required disabled={modal === 'encargado' || disabled} className="input-field mt-1" value={form.Puesto} onChange={e => field('Puesto', e.target.value)}><option value="">Seleccionar puesto</option>{data.puestos.filter(p => p.Area === form.Area).map(p => <option key={p.Codigo} value={p.Codigo}>{p.Nombre}</option>)}</select></label>
          {selectedPosition && <div className="org-modal-context"><span>Las herramientas se asignan automáticamente.</span><strong>{selectedPosition.Nombre}</strong></div>}
          {transfer && <label className="block rounded-xl bg-amber-50 p-3 text-sm"><input required type="checkbox" checked={form.ConfirmarTraslado} onChange={e => field('ConfirmarTraslado', e.target.checked)} className="mr-2" />{previous.Area === form.Area ? <>Confirmo cambiar el puesto de {previous.Puesto} a {form.Puesto}. Se registrará el cambio y se actualizarán cargo y accesos.</> : <>Confirmo el traslado de {data.areas.find(a => a.Codigo === previous.Area)?.Nombre} a {destination?.Nombre}. Se cerrará la asignación anterior.</>}</label>}
          {replace && <label className="block rounded-xl bg-amber-50 p-3 text-sm"><input required type="checkbox" checked={form.ReemplazarEncargado} onChange={e => field('ReemplazarEncargado', e.target.checked)} className="mr-2" />Confirmo reemplazar a {name(destinationLeader.idEmpleado)}. El encargado anterior quedará sin área ni cargo hasta recibir otra asignación.</label>}
        </>}
        <label className="block">Motivo<select required className="input-field mt-1" value={form.Motivo} onChange={e => field('Motivo', e.target.value)}><option value="">Seleccionar motivo</option>{reasons.map(r => <option key={r}>{r}</option>)}</select></label>
      </fieldset><div className="flex justify-end gap-2"><button type="button" disabled={busy} className="btn-secondary" onClick={close}>Cancelar</button><button disabled={disabled} className="btn-primary">{busy ? 'Guardando…' : modal === 'finalizar' ? 'Finalizar asignación' : 'Confirmar asignación'}</button></div>
    </form></AssignmentDialog>}
  </div>
}
