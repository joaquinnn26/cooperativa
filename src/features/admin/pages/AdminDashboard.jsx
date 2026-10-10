import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { laboralApi, apiLaboralExistente } from '@/utils/laboral.js'
import { ArrowUpRight, BarChart3, Users, Building2, ShieldCheck, Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import './AdminDashboard.css'

const groups = [
  { title: 'Organización y personal', intro: 'Administrá accesos y estructura interna.', links: [
    ['/admin/organizacion', 'Organización laboral', 'Asignar áreas, integrantes, funciones y encargados.'],
    ['/admin/empleados', 'Empleados', 'Altas, cargos y bajas laborales.'],
    ['/admin/legajos', 'Legajos de personas', 'Revisar los documentos vinculados a cada persona.']
  ] },
  { title: 'Atención a socios', intro: 'Accedé a los datos y requisitos usados en la atención.', links: [
    ['/admin/socios', 'Socios', 'Consultar personas y cuentas registradas.'],
    ['/admin/altas-socio', 'Altas de socios', 'Revisar requisitos y habilitar cuentas nuevas.'],
    ['/admin/requisitos-servicio', 'Requisitos de servicio', 'Consultar y configurar requisitos de solicitudes.']
  ] },
  { title: 'Servicios y operación', intro: 'Configuración de datos que respaldan la operación.', links: [
    ['/admin/servicios', 'Servicios', 'Consultar servicios disponibles.'],
    ['/admin/territorio', 'Conexiones y territorio', 'Ubicaciones, zonas, rutas y folios.'],
    ['/admin/medidores', 'Inventario de medidores', 'Equipos disponibles, instalados e historial.']
  ] },
  { title: 'Comunicación', intro: 'Información general para los socios.', links: [
    ['/admin/anuncios', 'Anuncios', 'Publicar y administrar avisos.']
  ] }
]

export default function AdminDashboard() {
  const [data, setData] = useState(null), [socios, setSocios] = useState(null)
  const [errors, setErrors] = useState([]), [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0), [updated, setUpdated] = useState(null)
  const [search, setSearch] = useState('')
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setErrors([])
    Promise.allSettled([
      laboralApi('/configuracion', { signal: abort.signal }).then(value => {
        if (!value || !['areas', 'miembros', 'encargados', 'empleados'].every(key => Array.isArray(value[key]))) throw new Error('Formato inesperado')
        return value
      }),
      apiLaboralExistente('/socio', { signal: abort.signal }).then(value => {
        const rows = Array.isArray(value) ? value : value?.$values
        if (!Array.isArray(rows)) throw new Error('Formato inesperado')
        return rows
      })
    ]).then(([organization, members]) => {
      if (abort.signal.aborted) return
      setData(organization.status === 'fulfilled' ? organization.value : null)
      setSocios(members.status === 'fulfilled' ? members.value : null)
      setErrors([organization.status === 'rejected' && 'organización laboral', members.status === 'rejected' && 'socios'].filter(Boolean))
      setUpdated(organization.status === 'fulfilled' || members.status === 'fulfilled' ? new Date() : null)
      setLoading(false)
    })
    return () => abort.abort()
  }, [revision])
  const setup = useMemo(() => {
    if (!data) return null
    const areas = data.areas.map(area => {
      const members = data.miembros.filter(m => m.Area === area.Codigo && !m.HastaUtc)
      const leader = data.encargados.find(m => m.Area === area.Codigo && !m.HastaUtc)
      return { ...area, count: members.length, leader, unassigned: !members.length || (area.Codigo !== 'GERENCIA' && !leader) }
    })
    return { areas, needsSetup: areas.filter(a => a.unassigned).length, employees: data.empleados.filter(e => e.Activo).length }
  }, [data])

  const active = socios?.filter(s => ![false, 0, 'false', '0', 'inactivo', 'inactiva', 'no'].includes(typeof (s.Activo ?? s.activo ?? s.EstadoActivo) === 'string' ? String(s.Activo ?? s.activo ?? s.EstadoActivo).trim().toLowerCase() : (s.Activo ?? s.activo ?? s.EstadoActivo))).length
  const distribution = socios ? [{ name: 'Activos', value: active, color: '#0d9488' }, { name: 'Inactivos', value: socios.length - active, color: '#cbd5e1' }] : []
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filteredGroups = groups.map(group => ({ ...group, links: group.links.filter(link => normalize(`${group.title} ${link.join(' ')}`).includes(normalize(search.trim()))) })).filter(group => group.links.length)
  const stats = [
    { label: 'Socios registrados', value: socios?.length, detail: socios ? `${active} activos en la cooperativa` : 'Información no disponible', icon: Users, color: 'teal', to: '/admin/socios' },
    { label: 'Empleados activos', value: setup?.employees, detail: 'Personal con acceso laboral', icon: ShieldCheck, color: 'blue', to: '/admin/empleados' },
    { label: 'Áreas de trabajo', value: setup?.areas.length, detail: 'Estructura de la organización', icon: Building2, color: 'violet', to: '/admin/organizacion' },
    { label: 'Áreas por completar', value: setup?.needsSetup, detail: 'Requieren integrantes o encargado', icon: AlertCircle, color: 'amber', to: '/admin/organizacion' }
  ]
  const empty = text => <div className="ad-empty"><BarChart3 size={28} aria-hidden="true" /><p>{loading ? 'Cargando indicadores…' : text}</p></div>

  return <div className="admin-dashboard">
    <header className="ad-hero">
      <div className="ad-hero-content"><span className="ad-eyebrow"><span /> PANEL DE ADMINISTRACIÓN</span><h1>Tu cooperativa, de un vistazo.</h1><p>Los números clave y las herramientas que necesitás para gestionar cada día.</p>
        <Link to="/admin/estadisticas-eventos" className="ad-hero-link">Explorar estadísticas e historial <ArrowUpRight size={17} /></Link>
      </div><div className="ad-hero-art" aria-hidden="true"><BarChart3 size={72} strokeWidth={1.2} /><span>VISIÓN GENERAL</span></div>
    </header>
    <div className="ad-toolbar"><div><h2>Resumen general</h2><p role="status">{loading ? 'Actualizando información…' : updated ? `Última consulta: ${updated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · Estado actual` : 'Datos no disponibles'}</p></div><button type="button" className="ad-button" disabled={loading} onClick={() => setRevision(r => r + 1)}><RefreshCw size={16} className={loading ? 'ad-spin' : ''} /> Actualizar</button></div>
    {errors.length > 0 && <div role="alert" className="ad-warning"><AlertCircle size={20} /><span>No se pudo consultar {errors.join(' y ')}. Podés reintentar con Actualizar. Los indicadores afectados aparecen como no disponibles.</span></div>}
    <section className="ad-stats" aria-label="Indicadores generales" aria-busy={loading}>{stats.map(({ label, value, detail, icon: Icon, color, to }, index) => <Link to={to} className={`ad-stat ad-${color}`} key={label} style={{ animationDelay: `${index * 65}ms` }}><div className="ad-stat-top"><span className="ad-icon"><Icon size={21} /></span><ArrowUpRight size={17} /></div><p>{label}</p>{loading ? <span className="ad-skeleton" /> : <strong>{value == null ? '—' : value.toLocaleString('es-AR')}</strong>}<small>{!loading && value == null ? 'Información no disponible' : detail}</small></Link>)}</section>
    <div className="ad-charts">
      <section className="ad-panel"><div className="ad-panel-heading"><div><h2>Equipo por área</h2><p>Distribución de integrantes vigentes</p></div><span className="ad-icon ad-blue"><Building2 size={20} /></span></div>
        {!loading && setup?.areas.length ? <><div style={{ height: Math.max(240, setup.areas.length * 54), minWidth: 0 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={setup.areas} layout="vertical" margin={{ top: 8, right: 25, left: 0, bottom: 8 }} accessibilityLayer><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#e8edf3" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="Nombre" width={112} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} /><Bar dataKey="count" name="Integrantes" fill="#3875ca" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><details className="ad-data"><summary>Ver cantidades por área</summary><ul>{setup.areas.map(a => <li key={a.Codigo}><span>{a.Nombre}</span><b>{a.count}</b></li>)}</ul></details><p className="ad-note">Una persona puede integrar más de un área.</p></> : empty(setup ? 'Todavía no hay áreas registradas.' : 'No se pudo cargar la organización.')}
      </section>
      <section className="ad-panel"><div className="ad-panel-heading"><div><h2>Comunidad de socios</h2><p>Estado de las cuentas registradas</p></div><span className="ad-icon ad-teal"><Users size={20} /></span></div>
        {!loading && socios?.length ? <><div className="ad-donut"><ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer><Pie data={distribution} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="88%" paddingAngle={3} stroke="none" isAnimationActive={false}>{distribution.map(row => <Cell key={row.name} fill={row.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12 }} /></PieChart></ResponsiveContainer><div className="ad-donut-label"><strong>{Math.round(active / socios.length * 100)}%</strong><span>socios activos</span></div></div><ul className="ad-legend">{distribution.map(row => <li key={row.name}><span><i style={{ background: row.color }} />{row.name}</span><b>{row.value.toLocaleString('es-AR')}</b></li>)}</ul></> : empty(socios ? 'Todavía no hay socios registrados.' : 'No se pudieron cargar los socios.')}
      </section>
    </div>
    <section className="ad-panel"><div className="ad-panel-heading"><div><h2>Estado de la organización</h2><p>Revisá qué áreas necesitan atención</p></div><Link className="ad-text-link" to="/admin/organizacion">Gestionar <ArrowUpRight size={16} /></Link></div>
      {loading || !setup ? <p className="ad-note">{loading ? 'Consultando configuración…' : 'Información no disponible.'}</p> : !setup.areas.length ? <p className="ad-note">Todavía no hay áreas configuradas.</p> : <><div className="ad-health"><span><CheckCircle2 size={18} /> {setup.areas.length - setup.needsSetup} de {setup.areas.length} áreas con integrantes y encargado</span><b>{Math.round((setup.areas.length - setup.needsSetup) / setup.areas.length * 100)}%</b></div><div className="ad-progress"><span style={{ width: `${(setup.areas.length - setup.needsSetup) / setup.areas.length * 100}%` }} /></div><div className="ad-area-list">{setup.areas.map(a => <Link to="/admin/organizacion" key={a.Codigo} className="ad-area"><span className={`ad-dot ${a.unassigned ? 'pending' : ''}`} /><span>{a.Nombre}</span><small>{a.unassigned ? [!a.count && 'Sin integrantes', !a.leader && 'Sin encargado'].filter(Boolean).join(' · ') : 'Configurada'}</small><ArrowUpRight size={14} /></Link>)}</div></>}
    </section>
    <section><div className="ad-toolbar ad-access-heading"><div><h2>¿Qué necesitás gestionar?</h2><p>Todos tus accesos, en un solo lugar.</p></div><label className="ad-search"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar una herramienta…" aria-label="Buscar herramientas de administración" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">×</button>}</label></div>
      <div className="ad-access-groups">{filteredGroups.map((group) => <section key={group.title}><h3 className="ad-group-title">{group.title}</h3><div className="ad-links">{group.links.map(([to, title, description]) => <Link key={to} to={to} className="ad-access"><div><h4>{title}</h4><p>{description}</p></div><ArrowUpRight size={18} /></Link>)}</div></section>)}</div>{!filteredGroups.length && <div className="ad-empty" role="status">No encontramos herramientas para “{search}”. Probá con socios, empleados o servicios.</div>}
    </section>
  </div>
}
