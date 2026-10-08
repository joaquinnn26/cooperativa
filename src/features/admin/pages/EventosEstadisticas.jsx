import React, { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, ChevronRight, Search, RotateCcw } from 'lucide-react'
import { eventosOperativosApi } from '@/utils/eventosOperativosApi.js'
import useAuthStore from '@/store/authStore.js'
import { normalizeRole } from '@/utils/auth.js'

const CONTEXTOS = [
  ['LECTURA_NO_REALIZADA', 'Lecturas no realizadas'], ['LECTURA_REALIZADA', 'Lecturas realizadas'],
  ['MEDIDOR_FALLA', 'Fallas de medidor'],
  ['LECTURA_CORRECCION', 'Correcciones de lectura'], ['MEDIDOR_MIGRACION', 'Historial de medidores'],
  ['MEDIDOR_REEMPLAZO', 'Reemplazos de medidor'], ['INSTALACION_NO_REALIZADA', 'Instalaciones no realizadas'],
  ['SOLICITUD_SERVICIO_RECHAZO', 'Solicitudes de servicio rechazadas'], ['TERRITORIO', 'Territorio'],
  ['HOJA_RUTA', 'Hojas de ruta'], ['LECTURA_CORRECCION', 'Corrección de lectura'], ['RECLAMO', 'Reclamos'],
  ['RECLAMO_DERIVACION', 'Derivación de reclamos'], ['RECLAMO_DEVOLUCION', 'Devolución de reclamos'],
  ['RECLAMO_RESOLUCION', 'Resolución de reclamos'], ['DOCUMENTO_PERSONA', 'Documentos de persona'],
  ['BAJA_SERVICIO', 'Baja de servicio'], ['BAJA_SOCIO', 'Baja de socio'], ['EMPLEADO_BAJA', 'Baja laboral'],
  ['HOJA_RUTA_CANCELACION', 'Cancelación de ruta'], ['HOJA_RUTA_REASIGNACION', 'Reasignación de ruta']
]
const AREAS = { ADMINISTRACION: 'Administración', AGUA: 'Agua potable', ENERGIA: 'Electricidad', INTERNET: 'Internet', GAS: 'Gas', GERENCIA: 'Gerencia', GENERAL: 'General', SIN_AREA: 'Sin área' }
const EVENTOS = { AltaEmpleado: 'Alta de empleado', BajaEmpleado: 'Baja de empleado', SocioRegistrado: 'Socio registrado', SocioDadoDeBaja: 'Socio dado de baja', SocioReactivado: 'Socio reactivado', AltaSocioAprobada: 'Alta de socio aprobada', AltaSocioRechazada: 'Alta de socio rechazada', LecturaNoRealizada: 'Lectura no realizada', LecturaRealizada: 'Lectura realizada', RegistrarLectura: 'Lectura registrada', MedidorReemplazado: 'Medidor reemplazado', InstalacionNoRealizada: 'Instalación no realizada', SolicitudRechazada: 'Solicitud rechazada', ReclamoCreado: 'Reclamo creado', EstadoReclamoCambiado: 'Estado del reclamo actualizado', CambiarCargo: 'Cambio de cargo', SocioEstado: 'Cambio de estado del socio', TiempoCaducado: 'Plazo vencido', CorregirLectura: 'Corrección de lectura' }
const humanizar = value => { const text = String(value || '').trim().replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLocaleLowerCase('es-AR'); return text ? text[0].toLocaleUpperCase('es-AR') + text.slice(1) : 'Sin especificar' }
const etiquetaArea = value => AREAS[String(value || '').toUpperCase()] || humanizar(value || 'General')
const etiquetaEvento = value => EVENTOS[value] || humanizar(value)
const etiquetaContexto = code => { const known = CONTEXTOS.find(([value]) => value === code)?.[1]; if (known) return known; if (code?.startsWith('LABORAL_')) { const rest = code.slice(8); const area = Object.keys(AREAS).filter(key => key !== 'GENERAL' && rest.startsWith(`${key}_`)).sort((a, b) => b.length - a.length)[0]; if (area) return `Actividad laboral · ${etiquetaArea(area)} · ${etiquetaEvento(rest.slice(area.length + 1))}`; return `Actividad laboral · ${etiquetaEvento(rest.startsWith('GENERAL_') ? rest.slice(8) : rest)}` } if (code?.startsWith('MEDIDOR_')) return `Medidores · ${humanizar(code.slice(8))}`; if (code?.startsWith('TERRITORIO_')) return `Territorio · ${humanizar(code.slice(10))}`; if (code === 'DOCUMENTO_PERSONA_RECHAZO') return 'Rechazo de documentación personal'; return humanizar(code) }
const today = () => new Date().toISOString().slice(0, 10)
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) }

export default function EventosEstadisticas() {
  const role = useAuthStore(state => state.rol)
  const isAdmin = normalizeRole(role) === 'Administrador'
  const [filters, setFilters] = useState({ desde: monthAgo(), hasta: today(), contexto: '', area: '', folio: '', empleado: '', servicio: '', conexion: '', medidor: '', ruta: '' })
  const [rows, setRows] = useState([]), [records, setRecords] = useState([]), [selected, setSelected] = useState(null)
  const [previousRows, setPreviousRows] = useState([]), [comparePeriods, setComparePeriods] = useState(false)
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [searched, setSearched] = useState(false)
  const [contexts, setContexts] = useState([])
  const [catalogContext, setCatalogContext] = useState('LECTURA_NO_REALIZADA'), [catalogContexts, setCatalogContexts] = useState(CONTEXTOS), [catalog, setCatalog] = useState([]), [catalogMessage, setCatalogMessage] = useState('')
  const [reasonContext, setReasonContext] = useState('BAJA_SOCIO')
  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.desde) p.set('DesdeUtc', `${filters.desde}T00:00:00Z`)
    if (filters.hasta) { const end = new Date(`${filters.hasta}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + 1); p.set('HastaUtc', end.toISOString()) }
    if (filters.contexto) p.set('Contexto', filters.contexto)
    if (filters.area.trim()) p.set('Area', filters.area.trim().toUpperCase())
    if (filters.folio.trim()) p.set('Folio', filters.folio.trim())
    if (filters.empleado) p.set('idEmpleado', filters.empleado)
    if (filters.servicio) p.set('idServicio', filters.servicio)
    if (filters.conexion) p.set('idServicioSocio', filters.conexion)
    if (filters.medidor) p.set('idMedidor', filters.medidor)
    if (filters.ruta) p.set('idRutaMedicion', filters.ruta)
    return p.toString()
  }, [filters])
  const motivosPorProceso = useMemo(() => {
    const grouped = new Map()
    for (const row of rows) {
      if (row.Contexto !== reasonContext) continue
      const motivo = row.Motivo?.trim() || 'Sin motivo clasificado'
      grouped.set(motivo, (grouped.get(motivo) || 0) + Number(row.CantidadEventos || 0))
    }
    const total = [...grouped.values()].reduce((sum, count) => sum + count, 0)
    return [...grouped].map(([Motivo, Cantidad]) => ({ Motivo, Cantidad, Porcentaje: total ? Cantidad / total * 100 : 0 })).sort((a, b) => b.Cantidad - a.Cantidad)
  }, [rows, reasonContext])
  const maxMotivo = Math.max(1, ...motivosPorProceso.map(item => item.Cantidad))
  const run = async () => {
    setLoading(true); setError(''); setRecords([]); setSelected(null); setPreviousRows([])
    try {
      const result = await eventosOperativosApi(`/estadisticas?${query}`); setRows(result.datos || [])
      if (comparePeriods && filters.desde && filters.hasta) {
        const start = new Date(`${filters.desde}T00:00:00Z`), end = new Date(`${filters.hasta}T00:00:00Z`)
        end.setUTCDate(end.getUTCDate() + 1)
        const duration = end.getTime() - start.getTime(), previousStart = new Date(start.getTime() - duration)
        const p = new URLSearchParams(query); p.set('DesdeUtc', previousStart.toISOString()); p.set('HastaUtc', start.toISOString())
        const previous = await eventosOperativosApi(`/estadisticas?${p.toString()}`); setPreviousRows(previous.datos || [])
      }
      setSearched(true)
    }
    catch (e) { setError(e.message || 'No se pudieron consultar las estadísticas.') }
    finally { setLoading(false) }
  }
  useEffect(() => { run() }, [])
  useEffect(() => { eventosOperativosApi('/contextos').then(setContexts).catch(() => setContexts([])) }, [])
  const openRecords = async (row) => {
    setSelected(row); setRecords([]); setError('')
    try {
      const p = new URLSearchParams(query); p.set('contexto', row.Contexto); p.set('codigoEvento', row.CodigoEvento)
      const result = await eventosOperativosApi(`/registros?${p.toString()}`); setRecords(result.items || [])
    } catch (e) { setError(e.message || 'No se pudieron abrir los registros.') }
  }
  const set = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const loadCatalog = async () => {
    try { const result = await eventosOperativosApi(`/motivos?contexto=${encodeURIComponent(catalogContext)}&incluirPendientes=true&incluirInactivos=true`); setCatalog(result || []); setCatalogMessage('') }
    catch (e) { setCatalogMessage(e.message || 'No se pudo cargar el catálogo.') }
  }
  useEffect(() => { if (isAdmin) loadCatalog() }, [isAdmin, catalogContext])
  useEffect(() => { if (isAdmin) eventosOperativosApi('/catalogos').then(rows => { const merged = new Map(CONTEXTOS); (rows || []).forEach(row => merged.set(row.Contexto, etiquetaContexto(row.Contexto))); setCatalogContexts([...merged].map(([code, label]) => [code, label])) }).catch(() => {}) }, [isAdmin])
  const updateMotive = async (motive, changes) => {
    setCatalogMessage('')
    try { await eventosOperativosApi(`/motivos/${motive.idMotivoEvento}`, { method: 'PUT', body: JSON.stringify({ ...motive, ...changes }) }); await loadCatalog() }
    catch (e) { setCatalogMessage(e.message || 'No se pudo actualizar la opción.') }
  }

  return <div className="event-history space-y-6">
    <header className="event-hero relative overflow-hidden rounded-3xl p-7 text-white shadow-lg"><div className="relative z-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-100">Panel de gestión</p><h1 className="mt-2 text-3xl font-bold">Estadísticas e historial</h1><p className="mt-2 text-sm text-blue-50">Indicadores y motivos registrados en las distintas áreas para reconocer tendencias y oportunidades de mejora.</p></div><div className="event-hero-orb" aria-hidden="true"><BarChart3 size={58}/></div></header>
    <section className="event-panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filtros">
      <label className="text-sm font-medium">Desde<input type="date" value={filters.desde} onChange={e => set('desde', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-medium">Hasta<input type="date" value={filters.hasta} onChange={e => set('hasta', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-medium">Proceso<select value={filters.contexto} onChange={e => set('contexto', e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Todos</option>{contexts.map(v => <option key={v} value={v}>{etiquetaContexto(v)}</option>)}</select></label>
      <label className="text-sm font-medium">Área<input value={filters.area} onChange={e => set('area', e.target.value)} placeholder="Ej.: AGUA o ADMINISTRACION" className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-medium">Folio<input value={filters.folio} onChange={e => set('folio', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      {[["empleado", "ID empleado"], ["servicio", "ID servicio"], ["conexion", "ID conexión"], ["medidor", "ID medidor"], ["ruta", "ID ruta"]].map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input type="number" min="1" value={filters[key]} onChange={e => set(key, e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>)}
      <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-5"><input type="checkbox" checked={comparePeriods} onChange={e => setComparePeriods(e.target.checked)} />Comparar con el período inmediatamente anterior de igual duración</label>
      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-5"><button type="button" onClick={run} disabled={loading} className="event-primary-button"><Search size={16}/>{loading ? 'Consultando…' : 'Aplicar filtros'}</button><button type="button" onClick={() => setFilters({ desde: monthAgo(), hasta: today(), contexto: '', area: '', folio: '', empleado: '', servicio: '', conexion: '', medidor: '', ruta: '' })} className="event-secondary-button"><RotateCcw size={16}/>Restablecer</button></div>
    </section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {searched && !loading && !rows.length && !error && <p className="card text-gray-600">Sin datos para este período.</p>}
    <section className="event-panel p-5 sm:p-6" aria-label="Motivos por proceso"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">Causas registradas</p><h2 className="mt-1 text-xl font-bold text-slate-900">Motivos por proceso</h2><p className="mt-1 text-sm text-slate-500">Cada porcentaje se calcula sobre el total de motivos del proceso seleccionado y los filtros aplicados.</p></div><label className="text-sm font-medium text-slate-600">Proceso<select value={reasonContext} onChange={e => setReasonContext(e.target.value)} className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2">{[...new Map([...CONTEXTOS, ...contexts.map(code => [code, etiquetaContexto(code)])]).entries()].map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label></div>{loading ? <p className="py-10 text-center text-sm text-slate-400">Calculando distribución…</p> : motivosPorProceso.length ? <div className="mt-6 grid gap-3">{motivosPorProceso.map((item, index) => <article key={item.Motivo} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4" style={{ animation: 'event-rise .35s ease both', animationDelay: `${index * 45}ms` }}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-800">{item.Motivo}</span><span className="text-sm font-bold text-slate-700">{item.Cantidad.toLocaleString('es-AR')} <span className="font-normal text-slate-400">({item.Porcentaje.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%)</span></span></div><div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="event-reason-bar h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500" style={{ width: `${item.Cantidad / maxMotivo * 100}%`, animationDelay: `${index * 45}ms` }} /></div></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center"><Activity className="mx-auto mb-2 text-slate-400" size={22}/><p className="font-medium text-slate-700">Todavía no hay motivos para este proceso</p><p className="mt-1 text-sm text-slate-500">Cuando se registren bajas con motivo, vas a ver acá la cantidad y el porcentaje de cada causa.</p></div>}</section>
    {rows.length > 0 && <section className="event-panel overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">Actividad registrada</h2><p className="mt-1 text-sm text-slate-500">Seleccioná un evento para revisar los registros que lo componen.</p><p className="mt-3 text-xs text-slate-500">El porcentaje se calcula sobre los eventos del mismo proceso y tipo dentro del período seleccionado.</p>{comparePeriods && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Eventos totales: {rows.reduce((n, r) => n + r.CantidadEventos, 0)} en el período actual y {previousRows.reduce((n, r) => n + r.CantidadEventos, 0)} en el período anterior.</p>}</div><div className="overflow-x-auto p-3 sm:p-5"><table className="event-table w-full min-w-[900px] text-left text-sm"><thead><tr><th>Proceso / evento</th><th>Motivo o resultado</th><th>Eventos</th><th>Operaciones</th><th>Registros distintos</th><th>Desconocidos</th><th>% de eventos</th><th></th></tr></thead><tbody>{rows.map((r, i) => <tr key={`${r.Contexto}-${r.CodigoEvento}-${r.Motivo}-${i}`}><td><span className="block font-semibold text-slate-800">{etiquetaContexto(r.Contexto)}</span><span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{etiquetaEvento(r.CodigoEvento)}</span></td><td>{r.Motivo || 'Sin motivo registrado'}</td><td className="font-bold">{r.CantidadEventos}</td><td>{r.CantidadOperaciones}</td><td>{r.RegistrosDistintos}</td><td>{r.MotivosDesconocidos}</td><td><span className="font-semibold text-blue-700">{r.PorcentajeDelEvento}%</span><span className="block text-xs text-slate-400">de {r.DenominadorEventos}</span></td><td><button onClick={() => openRecords(r)} className="event-detail-button">Ver origen<ChevronRight size={15}/></button></td></tr>)}</tbody></table></div></section>}
    {selected && <section className="card space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Registros de {selected.CodigoEvento}</h2><p className="text-sm text-gray-600">{selected.Contexto} · {selected.Motivo || 'Motivo no clasificado'}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2">Cerrar</button></div>{!records.length ? <p className="text-sm text-gray-600">Sin registros disponibles para esos filtros.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">Fecha del evento (UTC)</th><th className="p-2">Entidad / registro</th><th className="p-2">Realizado por</th><th className="p-2">Empleado relacionado</th><th className="p-2">Área</th><th className="p-2">Socio</th><th className="p-2">Medidor</th><th className="p-2">Estado anterior → nuevo</th><th className="p-2">Motivo / resultado</th></tr></thead><tbody>{records.map(r => <tr key={r.idEventoOperativo} className="border-b"><td className="p-2">{new Date(r.FechaEventoUtc).toLocaleString()}</td><td className="p-2">{r.Entidad} · {r.idEntidad}</td><td className="p-2">{r.EmpleadoActor || r.Usuario || (r.ActorSistema ? 'Sistema' : 'Usuario')}</td><td className="p-2">{r.idEmpleado && r.idEmpleado !== r.idEmpleadoActor ? (r.EmpleadoRelacionado || `Empleado #${r.idEmpleado}`) : '-'}</td><td className="p-2">{r.Area || '—'}</td><td className="p-2">{r.idSocio ?? '—'}</td><td className="p-2">{r.idMedidor ?? '—'}</td><td className="p-2">{r.EstadoAnterior || '—'} → {r.EstadoNuevo || '—'}</td><td className="p-2">{r.Motivo || r.Resultado || (r.MotivoDesconocido ? 'Motivo histórico desconocido' : '—')}{r.Detalle ? ` · ${r.Detalle}` : ''}</td></tr>)}</tbody></table></div>}</section>}
    {isAdmin && <section className="card space-y-4"><div><h2 className="text-xl font-bold">Catálogos de motivos</h2><p className="text-sm text-gray-600">Motivos predefinidos para conservar estadísticas comparables. Desde aquí solo se ordenan o activan.</p></div><div className="flex flex-wrap gap-3"><select value={catalogContext} onChange={e => setCatalogContext(e.target.value)} className="rounded-lg border p-2">{catalogContexts.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>{catalogMessage && <p role="status" className="text-sm text-blue-800">{catalogMessage}</p>}<div className="divide-y">{catalog.map(m => <div key={m.idMotivoEvento} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{m.Nombre}</p><p className="text-xs text-gray-500">{m.Codigo} · {m.ConfirmadoCooperativa ? 'Confirmado' : 'Pendiente de validación'} · {m.Activo ? 'Activo' : 'Inactivo'}{m.RequiereDetalle ? ' · detalle obligatorio' : ''}</p></div><div className="flex gap-2"><label className="flex items-center gap-2 text-sm"><span>Orden</span><input type="number" min="0" defaultValue={m.Orden} onBlur={e => { if (Number(e.target.value) !== Number(m.Orden)) updateMotive(m, { Orden: Number(e.target.value) }) }} className="w-16 rounded border p-1" /></label><button onClick={() => updateMotive(m, { Activo: !m.Activo })} className="rounded border px-3 py-1 text-sm">{m.Activo ? 'Desactivar' : 'Reactivar'}</button>{!m.ConfirmadoCooperativa && <button onClick={() => updateMotive(m, { ConfirmadoCooperativa: true })} className="rounded border border-green-300 px-3 py-1 text-sm text-green-800">Confirmar catálogo</button>}</div></div>)}</div></section>}
  </div>
}
