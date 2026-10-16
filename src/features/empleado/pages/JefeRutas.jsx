import React, { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPinned, Plus, RefreshCw, Search, UserRound, ArrowUpRight, X } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { laboralApi, apiLaboralExistente } from '@/utils/laboral.js'
import { showInfo } from '@/utils/alerts.js'
import CrearRecorridoDialog from './CrearRecorridoDialog.jsx'
import RecorridoDetalleDialog from './RecorridoDetalleDialog.jsx'
import { routeText, routeNumbers, routeDateLabel } from './recorridosUtils.js'
import './Recorridos.css'

export default function JefeRutas() {
  const profiles = useAuthStore(state => state.areas) || []
  const areas = profiles.filter(item => item.Encargado && ['AGUA', 'ENERGIA'].includes(item.Area))
  const [area, setArea] = useState(areas[0]?.Area || ''), [team, setTeam] = useState([]), [routes, setRoutes] = useState([])
  const [search, setSearch] = useState(''), [state, setState] = useState(''), [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  const [creating, setCreating] = useState(false), [detail, setDetail] = useState(null), [opening, setOpening] = useState(null)
  const request = useRef(0)
  useEffect(() => { if (!areas.some(item => item.Area === area) && areas[0]) setArea(areas[0].Area) }, [area, profiles])
  useEffect(() => () => { request.current++ }, [])
  useEffect(() => {
    if (!area) { setLoading(false); return }
    const abort = new AbortController(); setLoading(true); setError('')
    Promise.all([laboralApi(`/lecturistas?area=${area}`, { signal: abort.signal }), apiLaboralExistente('/rutas-medicion', { signal: abort.signal })])
      .then(([people, list]) => { if (!abort.signal.aborted) { setTeam(people); setRoutes(list) } })
      .catch(failure => { if (!abort.signal.aborted) setError(failure.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [area, revision])
  const areaRoutes = routes.filter(route => (route.items || []).some(item => area === 'AGUA' ? routeText(item.tipoMedidor || item.servicioNombre).includes('agua') : /electric|luz|energia/.test(routeText(item.tipoMedidor || item.servicioNombre))))
  const filtered = areaRoutes.filter(route => (!state || route.estado === state) && routeText([route.nombre, route.empleadoNombre, route.fecha, routeDateLabel(route.fecha), route.estado].join(' ')).includes(routeText(search.trim())))
  const pages = Math.max(1, Math.ceil(filtered.length / 9)), current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * 9, current * 9)
  async function openDetail(route) {
    const ticket = ++request.current; setOpening(route.idRutaMedicion)
    try { const fresh = await apiLaboralExistente(`/rutas-medicion/${route.idRutaMedicion}`); if (ticket === request.current) setDetail(fresh) }
    catch (failure) { if (ticket === request.current) await showInfo({ title: 'No se pudo abrir el recorrido', message: failure.message, type: 'error' }) }
    finally { if (ticket === request.current) setOpening(null) }
  }
  if (!areas.length) return <p className="card">Esta vista requiere ser encargado de Agua o Redes de Energía.</p>
  return <div className="routes-organizer">
    <header className="routes-hero"><div><span><MapPinned size={17}/>PLANIFICACIÓN DE LECTURAS</span><h1>Organizar recorridos</h1><p>Armá la hoja, elegí sus medidores y asignala al lecturista.</p><small>{areas.find(item => item.Area === area)?.Nombre}</small></div><button type="button" className="btn-primary" disabled={loading || Boolean(error)} onClick={() => setCreating(true)}><Plus size={18}/>Nuevo recorrido</button></header>
    <section className="routes-list"><div className="routes-list-heading"><div><h2>Recorridos del área</h2><p>Consultá responsables, lecturas registradas y novedades.</p></div><button type="button" className="btn-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={17} className={loading ? 'routes-spin' : ''}/>Actualizar</button></div><div className="routes-toolbar"><label className="routes-search"><Search size={18}/><input aria-label="Buscar recorrido" maxLength={100} placeholder="Buscar por nombre, lecturista o fecha…" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }}/>{search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { setSearch(''); setPage(1) }}><X size={16}/></button>}</label><select aria-label="Estado del recorrido" value={state} onChange={event => { setState(event.target.value); setPage(1) }}><option value="">Todos los estados</option>{[...new Set(areaRoutes.map(route => route.estado))].sort().map(value => <option key={value}>{value}</option>)}</select>{areas.length > 1 && <select aria-label="Área del recorrido" value={area} onChange={event => { setArea(event.target.value); setTeam([]); setState(''); setPage(1) }}>{areas.map(item => <option key={item.Area} value={item.Area}>{item.Nombre}</option>)}</select>}</div>
      {loading ? <div className="routes-empty" role="status"><RefreshCw size={25} className="routes-spin"/>Cargando recorridos…</div> : error ? <div className="routes-empty" role="alert"><h3>No se pudieron cargar los recorridos</h3><p>{error}</p><button type="button" className="btn-primary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div> : <><p className="routes-result-count">{filtered.length} {filtered.length === 1 ? 'recorrido encontrado' : 'recorridos encontrados'}</p><div className="routes-grid">{visible.map(route => { const progress = routeNumbers(route); return <article className="routes-card" key={route.idRutaMedicion}><header><span><MapPinned size={21}/></span><em>{route.estado}</em></header><h3>{route.nombre}</h3><p><CalendarDays size={15}/>{routeDateLabel(route.fecha)}</p><p><UserRound size={15}/>{route.empleadoNombre || 'Lecturista no informado'}</p><div className="routes-progress-label"><span>{progress.measured} de {progress.total} lecturas</span><strong>{progress.percent}%</strong></div><div className="routes-progress" role="progressbar" aria-label={`Lecturas registradas en ${route.nombre}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><span style={{width:`${progress.percent}%`}}/></div><small>{progress.incidents} novedades registradas · No cuentan como lecturas realizadas.</small><button type="button" disabled={Boolean(opening)} onClick={() => openDetail(route)}>{opening === route.idRutaMedicion ? 'Abriendo…' : 'Ver recorrido'}<ArrowUpRight size={17}/></button></article> })}</div>{!visible.length && <div className="routes-empty"><MapPinned size={35}/><h3>{search || state ? 'No hay coincidencias' : 'Todavía no hay recorridos en esta área'}</h3><p>{search || state ? 'Probá con otra búsqueda o estado.' : 'Creá el primero y asignalo a un lecturista.'}</p><button type="button" className="btn-secondary" onClick={() => { if (search || state) { setSearch(''); setState(''); setPage(1) } else setCreating(true) }}>{search || state ? 'Limpiar búsqueda' : 'Crear recorrido'}</button></div>}<nav className="routes-pagination" aria-label="Páginas de recorridos"><span>{filtered.length ? (current - 1) * 9 + 1 : 0}–{Math.min(current * 9, filtered.length)} de {filtered.length}</span><div><button type="button" aria-label="Página anterior" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={18}/></button><span>Página {current} de {pages}</span><button type="button" aria-label="Página siguiente" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={18}/></button></div></nav></>}
    </section>
    {creating && <CrearRecorridoDialog area={area} areaName={areas.find(item => item.Area === area)?.Nombre} team={team} routes={routes} onClose={() => setCreating(false)} onCreated={route => { setCreating(false); setDetail(route); setRevision(value => value + 1) }}/>} {detail && <RecorridoDetalleDialog route={detail} onClose={() => setDetail(null)}/>}
  </div>
}
