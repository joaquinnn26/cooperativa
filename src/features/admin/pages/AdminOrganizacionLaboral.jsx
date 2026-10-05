import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { laboralApi } from '@/utils/laboral.js'

const tabs = [
  ['equipo', 'Equipo'], ['encargado', 'Encargado'], ['motivos', 'Motivos'],
['cuentas', 'Accesos']
]
const motivosCambio = ['Asignación inicial', 'Reorganización interna', 'Cambio de responsabilidades', 'Cobertura temporal', 'Corrección de asignación', 'Actualización de catálogo', 'Revocación por cambio de puesto']

function Modal({ title, close, children, busy }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !busy) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, close])
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget && !busy) close() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4"><h2 id="admin-modal-title" className="text-xl font-bold">{title}</h2><button type="button" className="rounded-lg px-3 py-1 text-gray-600 hover:bg-gray-100" onClick={close} disabled={busy} aria-label="Cerrar">✕</button></div>
      {children}
    </section>
  </div>
}

const personaVacia = () => ({ modo: 'nueva', idPersona: '', Nombre: '', Apellido: '', Documento: '', Email: '', Telefono: '', Calle: '', Numero: '' })

export default function AdminOrganizacionLaboral() {
  const [data, setData] = useState(null)
  const [area, setArea] = useState('ADMINISTRACION')
  const [tab, setTab] = useState('equipo')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ idEmpleado: '', Funcion: '', Motivo: '', Nombre: '', Decision: 'Rechazar', Password: '' })
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0)
  const [accessForm, setAccessForm] = useState({ gerente: personaVacia(), administrador: personaVacia() })
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [personasDisponibles, setPersonasDisponibles] = useState([])

  useEffect(() => {
    const abort = new AbortController()
    Promise.all([laboralApi('/configuracion', { signal: abort.signal }), laboralApi('/accesos/personas-disponibles', { signal: abort.signal })]).then(([d,people]) => { if (!abort.signal.aborted) { setData(d); setPersonasDisponibles(people) } }).catch(e => { if (!abort.signal.aborted) setError(e.message) })
    return () => abort.abort()
  }, [revision])

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const accessField = (who, key, value) => setAccessForm(current => ({ ...current, [who]: { ...current[who], [key]: value } }))
  const closeModal = () => { if (modal?.type === 'accesos') setAccessForm({ gerente: personaVacia(), administrador: personaVacia() }); setModal(null) }
  const open = (type, extra = {}) => { setError(''); setForm({ idEmpleado: '', Funcion: '', Motivo: '', Nombre: '', Decision: 'Rechazar', Password: '', ...extra }); setModal({ type, ...extra }) }
  async function save(payload, closeModal = false) {
    if (!form.Motivo.trim()) { setError('Indicá el motivo del cambio para conservar el historial.'); return false }
    setBusy(true); setError(''); setNotice('')
    try {
      await laboralApi('/configuracion', { method: 'POST', body: JSON.stringify({ Area: area, Motivo: form.Motivo, ...payload }) })
      setNotice('Cambio guardado. Los permisos se verifican nuevamente en cada operación.'); setRevision(r => r + 1); setForm(f => ({ ...f, Motivo: '', Password: '' }))
      if (closeModal) setModal(null)
      return true
    } catch (e) { setError(e.message); return false } finally { setBusy(false) }
  }

  if (!data) return <p role={error ? 'alert' : 'status'}>{error || 'Cargando organización laboral…'}</p>
  const members = data.miembros.filter(m => m.Area === area && !m.HastaUtc)
  const leader = data.encargados.find(c => c.Area === area && !c.HastaUtc)
  const employeeName = id => data.empleados.find(e => e.idEmpleado === id)?.Nombre || `Empleado ${id}`
  const areaRow = data.areas.find(a => a.Codigo === area)
  const availableEmployees = data.empleados.filter(e => e.Activo && !members.some(m => m.idEmpleado === e.idEmpleado))
  const modalTitle = { miembro: 'Agregar empleado al área', funcion: `Asignar función a ${employeeName(modal?.employeeId)}`, encargado: 'Designar encargado', cuenta: 'Crear acceso laboral', confirmar: modal?.label || 'Confirmar cambio' }[modal?.type]

  async function submitModal(e) {
    e.preventDefault()
    if (modal.type === 'accesos') {
      setBusy(true); setError(''); setNotice('')
      try {
        const mapPerson = person => person.modo === 'existente' ? { idPersona: Number(person.idPersona) } : person
        const result = await laboralApi('/accesos/gerencia-administracion', { method: 'POST', body: JSON.stringify({ Gerente: mapPerson(accessForm.gerente), Administrador: mapPerson(accessForm.administrador) }) })
        setCreatedCredentials(result); setAccessForm({ gerente: personaVacia(), administrador: personaVacia() }); setRevision(r => r + 1); setModal(null)
      } catch (e) { setError(e.message) } finally { setBusy(false) }
      return
    }
    if (modal.type === 'miembro') await save({ Accion: 'Miembro', idEmpleado: Number(form.idEmpleado), Activo: true }, true)
    if (modal.type === 'funcion') await save({ Accion: 'Funcion', idEmpleado: modal.employeeId, Funcion: form.Funcion, Activo: true }, true)
    if (modal.type === 'encargado') await save({ Accion: 'Encargado', idEmpleado: form.idEmpleado ? Number(form.idEmpleado) : null, Version: areaRow.Version }, true)
    if (modal.type === 'cuenta') await save({ Accion: 'Cuenta', Area: null, idEmpleado: Number(form.idEmpleado), Password: form.Password }, true)
    if (modal.type === 'confirmar') await save(modal.payload, true)
  }

  return <div className="space-y-6">
    <header className="space-y-2"><Link to="/admin" className="text-sm font-medium text-blue-700 hover:underline">← Administración</Link><h1 className="text-3xl font-bold">Organización laboral</h1><p className="max-w-3xl text-gray-600">Definí quién trabaja en cada área, sus funciones y quién revisa. Los cargos laborales existentes se conservan por separado.</p></header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
    <section className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_2fr]">
      <label className="card block">Área de trabajo<select className="input-field mt-2" value={area} onChange={e => { setArea(e.target.value); setError(''); setNotice('') }}>{data.areas.map(a => <option key={a.Codigo} value={a.Codigo}>{a.Nombre}</option>)}</select></label>
      <div className="card flex flex-col justify-center"><span className="text-sm text-gray-500">Encargado actual</span><strong className="mt-1 text-lg">{leader ? employeeName(leader.idEmpleado) : 'Sin designar'}</strong><span className="text-sm text-gray-600">{members.length} integrante{members.length === 1 ? '' : 's'} con asignación vigente</span></div>
    </section>
    {area === 'GAS' && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">Podés registrar equipo y encargado. Las operaciones concretas del convenio todavía requieren definición.</p>}
    <nav aria-label="Secciones de organización laboral" className="flex gap-2 overflow-x-auto border-b pb-2">{tabs.map(([v, label]) => <button key={v} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${tab === v ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`} onClick={() => { setTab(v); setError('') }}>{label}</button>)}</nav>

    {tab === 'equipo' && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Equipo y funciones</h2><p className="text-sm text-gray-600">La función determina qué tareas puede realizar cada integrante.</p></div><button className="btn-primary" onClick={() => open('miembro')}>+ Agregar integrante</button></div>
      {members.map(m => { const funcs = data.permisos.filter(f => f.idEmpleadoArea === m.idEmpleadoArea && !f.HastaUtc); return <article className="card space-y-3" key={m.idEmpleadoArea}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{employeeName(m.idEmpleado)}</h3><p className="text-sm text-gray-500">Integrante desde {new Date(m.DesdeUtc).toLocaleDateString('es-AR')}</p></div><button className="text-sm font-medium text-red-700 hover:underline" disabled={busy} onClick={() => open('confirmar', { label: 'Finalizar pertenencia al área', payload: { Accion: 'Miembro', idEmpleado: m.idEmpleado, Activo: false, Version: m.Version } })}>Finalizar pertenencia</button></div>
        {funcs.length ? <ul className="divide-y">{funcs.map(f => <li className="flex items-center justify-between gap-3 py-2" key={f.idEmpleadoFuncion}><span>{data.funciones.find(x => x.Codigo === f.Funcion)?.Nombre || f.Funcion}</span><button disabled={busy} className="text-sm text-red-700 hover:underline" onClick={() => open('confirmar', { label: 'Quitar función', payload: { Accion: 'Funcion', idEmpleado: m.idEmpleado, Funcion: f.Funcion, Activo: false, Version: f.Version } })}>Quitar función</button></li>)}</ul> : <p className="text-sm text-amber-800">Sin funciones asignadas todavía.</p>}
        <button className="btn-secondary" disabled={!data.funciones.some(f => f.Area === area && !funcs.some(p => p.Funcion === f.Codigo))} onClick={() => open('funcion', { employeeId: m.idEmpleado, memberId: m.idEmpleadoArea })}>+ Asignar función</button>
      </article> })}{!members.length && <div className="card text-gray-600">Todavía no hay integrantes asignados a esta área. Agregá un empleado para habilitar los accesos de trabajo.</div>}
    </section>}

    {tab === 'encargado' && <section className="space-y-4"><div className="card flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Encargado del área</h2><p className="text-sm text-gray-600">El encargado revisa y resuelve el trabajo del área. Cada designación queda en el historial.</p></div><button className="btn-primary" onClick={() => open('encargado')}>Cambiar encargado</button></div><h3 className="font-semibold">Historial</h3>{data.encargados.filter(c => c.Area === area).length ? data.encargados.filter(c => c.Area === area).map(c => <article key={c.idEncargadoArea} className="card"><strong>{employeeName(c.idEmpleado)}{!c.HastaUtc && <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Vigente</span>}</strong><p className="mt-1 text-sm text-gray-600">{new Date(c.DesdeUtc).toLocaleString('es-AR')} → {c.HastaUtc ? new Date(c.HastaUtc).toLocaleString('es-AR') : 'Actual'}</p><p className="mt-2 text-sm">Motivo: {c.Motivo}</p></article>) : <p className="card text-gray-600">No hay designaciones previas.</p>}</section>}

    {tab === 'motivos' && <section className="space-y-4"><div><h2 className="text-xl font-semibold">Catálogo de motivos</h2><p className="text-sm text-gray-600">Los motivos son opciones normalizadas para poder agrupar resultados y producir estadísticas. No se agregan textos libres.</p></div>{data.motivos.filter(m => m.Area === area).map(m => <article key={m.idMotivo} className="card flex flex-wrap justify-between gap-3"><span>{m.Accion === 'Rechazar' ? 'Rechazo' : m.Accion === 'Devolver' ? 'Devolución' : 'Corrección de lectura'} · {m.Nombre} · {m.Activo ? 'Activo' : 'Inactivo'}</span><button className="text-sm text-blue-700 hover:underline" disabled={busy} onClick={() => open('confirmar', { label: `${m.Activo ? 'Desactivar' : 'Activar'} motivo`, payload: { Accion: 'Motivo', Decision: m.Accion, idMotivo: m.idMotivo, Activo: !m.Activo, Version: m.Version } })}>{m.Activo ? 'Desactivar' : 'Activar'}</button></article>)}{!data.motivos.some(m => m.Area === area) && <p className="card text-gray-600">No hay motivos activos para esta área. Revisá la migración del catálogo.</p>}</section>}

    {tab === 'cuentas' && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Accesos de trabajo</h2><p className="text-sm text-gray-600">Cada empleado usa credenciales laborales separadas de su cuenta personal de socio.</p></div><button className="btn-primary" disabled={!data.empleados.some(e => e.Activo && !data.cuentas.some(c => c.idEmpleado === e.idEmpleado))} onClick={() => open('cuenta')}>+ Crear acceso</button></div><div className="divide-y rounded-xl border bg-white">{data.cuentas.map(c => <div className="flex flex-wrap justify-between gap-2 p-4" key={c.idUsuarioSistema}><span className="font-medium">{employeeName(c.idEmpleado)}</span><span className="text-sm text-gray-600">{c.Usuario}</span></div>)}{!data.cuentas.length && <p className="p-4 text-gray-600">Todavía no hay accesos laborales creados.</p>}</div></section>}

    {tab === 'cuentas' && <section className="card space-y-3"><h2 className="font-semibold">Alta de Gerencia y Administración</h2><p className="text-sm text-gray-600">Crea dos personas y cuentas distintas en una sola operación. Gerencia tendrá acceso laboral limitado; Administración tendrá permisos globales.</p><button className="btn-primary" onClick={() => open('accesos', { label: 'Crear accesos de Gerencia y Administración' })}>Crear ambos accesos</button>{createdCredentials && <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4" aria-live="polite"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">Copiá ahora las contraseñas iniciales</h3><p className="text-sm">Se guardan protegidas y no volverán a mostrarse.</p></div><button className="text-sm underline" onClick={() => setCreatedCredentials(null)}>Ocultar</button></div><div className="grid gap-3 md:grid-cols-2">{[['Gerente',createdCredentials.gerente],['Administrador',createdCredentials.administrador]].map(([label,item]) => <div key={label} className="rounded border bg-white p-3"><strong>{label}</strong><p className="mt-2 text-sm">Usuario: <code>{item.usuario}</code></p><p className="mt-1 break-all text-sm">Contraseña: <code>{item.contrasenaInicial}</code></p><p className="text-xs">{item.rol}</p></div>)}</div></div>}</section>}
    {modal && <Modal title={modalTitle || modal.label || 'Crear accesos'} close={closeModal} busy={busy}><form className="space-y-4" onSubmit={submitModal}>
      {modal.type === 'accesos' && <><p className="text-sm text-gray-600">Se crearán dos empleados y dos cuentas para personas distintas. Podés reutilizar una persona registrada como socio o cargar una persona nueva. Las contraseñas se generarán al guardar.</p>{[['gerente','Persona gerente'],['administrador','Persona administradora']].map(([who,label]) => { const other=who==='gerente'?'administrador':'gerente'; const options=personasDisponibles.filter(p=>String(p.idPersona)!==String(accessForm[other].idPersona)); return <fieldset key={who} className="space-y-3 rounded-lg border p-3"><legend className="px-1 font-semibold">{label}</legend><label className="block text-sm">Persona<select className="input-field mt-1" value={accessForm[who].modo} onChange={e => setAccessForm(current => ({ ...current, [who]: { ...personaVacia(), modo: e.target.value } }))}><option value="nueva">Cargar persona nueva</option><option value="existente" disabled={!options.length}>Usar persona registrada con correo</option></select></label>{accessForm[who].modo==='existente' ? <label className="block text-sm">Persona registrada<select required className="input-field mt-1" value={accessForm[who].idPersona} onChange={e => accessField(who,'idPersona',e.target.value)}><option value="">Seleccionar persona</option>{options.map(p => <option key={p.idPersona} value={p.idPersona}>{p.Apellido}, {p.Nombre} · Doc. {p.Documento}</option>)}</select></label> : <div className="grid gap-3 sm:grid-cols-2">{[['Nombre','Nombre'],['Apellido','Apellido'],['Documento','Documento'],['Email','Correo electrónico'],['Telefono','Teléfono'],['Calle','Calle'],['Numero','Número']].map(([key,title]) => <label className="block text-sm" key={key}>{title}<input required={['Nombre','Apellido','Documento','Email'].includes(key)} type={key === 'Email' ? 'email' : 'text'} maxLength={key === 'Email' ? 150 : key === 'Documento' ? 30 : 120} autoComplete={key === 'Email' ? 'email' : 'off'} className="input-field mt-1" value={accessForm[who][key]} onChange={e => accessField(who,key,e.target.value)} /></label>)}</div>}</fieldset>})}</>}
      {modal.type === 'miembro' && <label className="block">Empleado activo<select required className="input-field mt-1" value={form.idEmpleado} onChange={e => field('idEmpleado', e.target.value)}><option value="">Seleccionar empleado</option>{availableEmployees.map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{e.Nombre} · {e.Cargo}</option>)}</select></label>}
      {modal.type === 'funcion' && <label className="block">Función<select required className="input-field mt-1" value={form.Funcion} onChange={e => field('Funcion', e.target.value)}><option value="">Seleccionar función</option>{data.funciones.filter(f => f.Area === area && !data.permisos.some(p => p.idEmpleadoArea === modal.memberId && p.Funcion === f.Codigo && !p.HastaUtc)).map(f => <option key={f.Codigo} value={f.Codigo}>{f.Nombre}</option>)}</select></label>}
      {modal.type === 'encargado' && <><label className="block">Empleado encargado<select className="input-field mt-1" value={form.idEmpleado} onChange={e => field('idEmpleado', e.target.value)}><option value="">Dejar área sin encargado</option>{members.map(m => <option key={m.idEmpleadoArea} value={m.idEmpleado}>{employeeName(m.idEmpleado)}</option>)}</select></label><p className="text-sm text-gray-600">La designación anterior finalizará y seguirá visible en el historial.</p></>}
      {modal.type === 'cuenta' && <><label className="block">Empleado<select required className="input-field mt-1" value={form.idEmpleado} onChange={e => field('idEmpleado', e.target.value)}><option value="">Seleccionar empleado</option>{data.empleados.filter(e => e.Activo && !data.cuentas.some(c => c.idEmpleado === e.idEmpleado)).map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{e.Nombre}</option>)}</select></label><label className="block">Contraseña inicial laboral<input required type="password" autoComplete="new-password" minLength={8} maxLength={100} className="input-field mt-1" value={form.Password} onChange={e => field('Password', e.target.value)} /></label><p className="text-xs text-gray-600">Debe incluir mayúscula, minúscula, número y símbolo.</p></>}
      {modal.type === 'confirmar' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Este cambio se registrará en el historial. Seleccioná el motivo para continuar.</p>}
      <label className="block">Motivo del cambio<select required className="input-field mt-1" value={form.Motivo} onChange={e => field('Motivo', e.target.value)}><option value="">Seleccionar motivo</option>{motivosCambio.map(value => <option key={value}>{value}</option>)}</select></label>
      <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={closeModal} disabled={busy}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
    </form></Modal>}
  </div>
}
