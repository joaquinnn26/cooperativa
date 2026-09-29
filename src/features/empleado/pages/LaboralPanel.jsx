import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { laboralApi, tareaEstados } from '@/utils/laboral.js'
import { rutasLaborales, tieneFuncion } from '@/utils/laboralPermissions.js'

export default function LaboralPanel({ gerencia = false }) {
  const { area } = useParams()
  const areas = useAuthStore(s => s.areas) || []
  const cargo = useAuthStore(s => s.cargo)
  const profile = areas.find(a => a.Area === area)
  const [rows, setRows] = useState({ items: [], total: 0 })
  const [summary, setSummary] = useState([])
  const [team, setTeam] = useState([])
  const [history, setHistory] = useState([])
  const [inbox, setInbox] = useState(null)
  const [state, setState] = useState('')
  const [tab, setTab] = useState('tareas')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [newTask, setNewTask] = useState(null)
  const [connections, setConnections] = useState([])
  const [connectionSearch, setConnectionSearch] = useState('')
  const manager = gerencia || tieneFuncion(areas, 'GERENCIA', 'CONSULTA_GENERAL')
  const operational = ['AGUA', 'ENERGIA', 'INTERNET', 'ADMINISTRACION'].includes(area)
  useEffect(() => { setPage(1); setTab('tareas'); setState('') }, [area])
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('')
    const query = new URLSearchParams({ pagina: page }); if (area) query.set('area', area); if (state) query.set('estado', state)
    Promise.all([laboralApi(`/tareas?${query}`, { signal: abort.signal }), laboralApi('/resumen', { signal: abort.signal }), laboralApi(`/actividad?pagina=${page}${area ? `&area=${area}` : ''}`, { signal: abort.signal }), profile?.Encargado ? laboralApi(`/equipo?area=${area}`, { signal: abort.signal }) : [], operational && (profile?.Encargado || profile?.Funciones?.includes('ATENCION')) ? laboralApi(`/bandeja?area=${area}`, { signal: abort.signal }) : null])
      .then(([list, counts, log, people, pending]) => { if (!abort.signal.aborted) { setRows(list); setSummary(counts); setHistory(log); setTeam(people); setInbox(pending) } })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [area, page, state, revision, areas])
  useEffect(() => {
    if (!newTask || !area) return
    const abort = new AbortController()
    const timer = setTimeout(() => laboralApi(`/conexiones?area=${area}&q=${encodeURIComponent(connectionSearch)}`, { signal: abort.signal }).then(setConnections).catch(e => { if (!abort.signal.aborted) setError(e.message) }), 250)
    return () => { abort.abort(); clearTimeout(timer) }
  }, [newTask?.Categoria, connectionSearch, area])
  async function create(payload) {
    setBusy(true); setError('')
    try { await laboralApi('/tareas', { method: 'POST', body: JSON.stringify(payload) }); setNewTask(null); setRevision(r => r + 1) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  if (area && !profile && !manager) return <p className="card">No tenés una asignación vigente en esta área.</p>
  if (!areas.length) return <div className="card space-y-3"><h1 className="text-2xl font-bold">Mi panel laboral</h1><p>Tu cuenta laboral está activa. Falta que administración configure tu área y tus funciones.</p><p>Cargo registrado: {cargo || 'Sin informar'}.</p></div>
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">{profile?.Nombre || (manager ? 'Actividad de las áreas' : 'Mi panel laboral')}</h1><p className="text-gray-600">{profile?.Encargado ? 'Organizá el equipo y revisá los trabajos de tu área.' : manager ? 'Consulta general de pendientes e intervenciones.' : 'Consultá tus asignaciones y registrá el trabajo realizado.'}</p><p className="text-sm text-gray-500">Cargo: {cargo || 'Sin informar'}{profile && ` · Encargado: ${profile.EncargadoNombre?.trim() || 'Sin designar'}`}</p></header>
    {!area && <div className="grid gap-3 md:grid-cols-2">{rutasLaborales(areas).map(r => <Link key={r.to} to={r.to} className="card hover:border-blue-400 border"><strong>{r.label}</strong><p className="text-sm text-gray-600">{r.description}</p></Link>)}</div>}
    {area === 'GAS' && <p className="card bg-amber-50">El área y su encargado pueden configurarse. Las operaciones de atención por convenio requieren definición de la cooperativa antes de habilitar tareas.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{summary.filter(a => !area || a.Area === area).map(a => <div className="card" key={a.Area}><h2 className="font-semibold">{a.Nombre}</h2>{a.conteos.map(c => <p className="text-sm mt-1" key={c.Estado}>{tareaEstados[c.Estado]}: <strong>{c.Cantidad}</strong></p>)}{!a.conteos.length && <p className="text-gray-500 text-sm">Sin tareas registradas.</p>}</div>)}</div>
    <div className="flex gap-2 flex-wrap">{[['tareas', profile?.Encargado || manager ? 'Tareas del área' : 'Mis tareas'], ['actividad', 'Historial de actividad'], ...(profile?.Encargado ? [['equipo', 'Equipo']] : []), ...(inbox ? [['bandeja', 'Trámites por organizar']] : [])].map(([key, label]) => <button key={key} className={tab === key ? 'btn-primary' : 'btn-secondary'} onClick={() => { setTab(key); setPage(1) }}>{label}</button>)}<button className="btn-secondary" onClick={() => setRevision(r => r + 1)}>Actualizar</button></div>
    {error && <p role="alert" className="p-3 bg-red-50 text-red-800">{error}</p>}
    {loading ? <p role="status">Cargando información del área…</p> : !error && <>
      {tab === 'tareas' && <section className="space-y-3"><div className="flex flex-wrap gap-3"><label>Estado<select className="input-field" value={state} onChange={e => { setState(e.target.value); setPage(1) }}><option value="">Todos</option>{Object.entries(tareaEstados).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>{profile?.Encargado && operational && <button className="btn-primary self-end" onClick={() => setNewTask({ Area: area, Categoria: 'Trabajo', Titulo: '', idServicioSocio: '' })}>Crear trabajo</button>}</div>{rows.items.map(t => <Link key={t.idTarea} to={`/empleado/tareas/${t.idTarea}`} className="card block hover:border-blue-400 border"><div className="flex gap-3 justify-between"><h2 className="font-semibold">{t.Titulo}</h2><span className="text-sm text-blue-700">{tareaEstados[t.Estado]}</span></div><p>{t.Socio || 'Trabajo interno'}{t.Servicio && ` · ${t.Servicio}`}</p><p className="text-sm text-gray-600">{t.AreaNombre} · {t.Asignado?.trim() || 'Sin asignar'}{t.Direccion && ` · ${t.Direccion}`}</p><p className="text-sm text-blue-700 mt-2">Ver trabajo y seguimiento →</p></Link>)}{!rows.total && <p className="card">No hay tareas para esta vista.</p>}<div className="flex justify-between"><button disabled={page === 1} className="btn-secondary" onClick={() => setPage(p => p - 1)}>Anterior</button><span>{rows.total} tareas · Página {page}</span><button disabled={page * 25 >= rows.total} className="btn-secondary" onClick={() => setPage(p => p + 1)}>Siguiente</button></div></section>}
      {tab === 'equipo' && <section className="space-y-3">{team.map(e => <div className="card" key={e.idEmpleado}><strong>{e.Nombre}</strong><p>{e.Cargo} · {e.Pendientes} trabajos pendientes</p></div>)}{!team.length && <p>Sin miembros activos.</p>}</section>}
      {tab === 'actividad' && <section className="space-y-3">{history.map(h => <div key={h.idAuditoria} className="card text-sm"><strong>{h.Accion}</strong> · {h.Area} · {h.Responsable}<p>{tareaEstados[h.EstadoAnterior] || h.EstadoAnterior} → {tareaEstados[h.EstadoNuevo] || h.EstadoNuevo}</p><p>{h.Motivo}</p><time>{new Date(h.FechaUtc).toLocaleString('es-AR')}</time></div>)}{!history.length && <p>Sin intervenciones registradas.</p>}<div className="flex justify-between"><button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><button className="btn-secondary" disabled={history.length < 50} onClick={() => setPage(p => p + 1)}>Siguiente</button></div></section>}
      {tab === 'bandeja' && <section className="space-y-3">{inbox?.solicitudes?.map(s => <article key={s.OrigenId} className="card"><h2 className="font-semibold">{s.Socio} · {s.Servicio}</h2><p>{s.Estado}</p><p className="text-sm">{s.Observaciones}</p><button disabled={busy} className="btn-primary mt-3" onClick={() => create({ Area: area, Categoria: s.Categoria, OrigenId: s.OrigenId, Titulo: `${s.Categoria === 'Solicitud' ? 'Revisión administrativa' : 'Instalación'} de ${s.Servicio}` })}>Incorporar al trabajo del área</button></article>)}{inbox?.reclamos?.map(r => <DerivarReclamo key={r.OrigenId} reclamo={r} busy={busy} onCreate={create} />)}{!inbox?.solicitudes?.length && !inbox?.reclamos?.length && <p className="card">No hay trámites sin organizar.</p>}</section>}
    </>}
    {newTask && <form className="card space-y-3 border-blue-300 border" onSubmit={e => { e.preventDefault(); create({ ...newTask, idServicioSocio: newTask.idServicioSocio ? Number(newTask.idServicioSocio) : null }) }}><h2 className="font-semibold">Nuevo trabajo de {profile.Nombre}</h2><label className="block">Descripción del trabajo<input required maxLength={200} className="input-field" value={newTask.Titulo} onChange={e => setNewTask(t => ({ ...t, Titulo: e.target.value }))} /></label><label className="block">Buscar conexión (opcional)<input className="input-field" value={connectionSearch} onChange={e => setConnectionSearch(e.target.value)} /></label><label className="block">Conexión<select className="input-field" value={newTask.idServicioSocio} onChange={e => setNewTask(t => ({ ...t, idServicioSocio: e.target.value }))}><option value="">Trabajo interno, sin conexión</option>{connections.map((c, i) => <option key={`${c.idServicioSocio}-${i}`} value={c.idServicioSocio}>{c.Socio} · {c.Servicio} · {c.Direccion || `Conexión ${c.idServicioSocio}`} · Ruta {c.Ruta || '—'} / {c.Folio || '—'}</option>)}</select></label><div className="flex gap-3"><button disabled={busy} className="btn-primary">Crear trabajo</button><button type="button" disabled={busy} className="btn-secondary" onClick={() => setNewTask(null)}>Cancelar</button></div></form>}
  </div>
}
function DerivarReclamo({ reclamo, busy, onCreate }) {
  const [area, setArea] = useState('')
  return <form className="card space-y-3" onSubmit={e => { e.preventDefault(); onCreate({ Area: area, Categoria: 'Reclamo', OrigenId: reclamo.OrigenId, Titulo: `Atender reclamo de ${reclamo.Socio}` }) }}><h2 className="font-semibold">Reclamo de {reclamo.Socio}</h2><p>{reclamo.Descripcion}</p><label>Área responsable<select required className="input-field" value={area} onChange={e => setArea(e.target.value)}><option value="">Seleccionar</option>{[['ADMINISTRACION', 'Administración'], ['AGUA', 'Agua'], ['ENERGIA', 'Energía'], ['INTERNET', 'Internet']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><button disabled={busy} className="btn-primary">Derivar al área</button></form>
}
