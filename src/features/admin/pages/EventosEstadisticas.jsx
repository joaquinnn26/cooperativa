import React, { useEffect, useMemo, useState } from 'react'
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
  useEffect(() => { if (isAdmin) eventosOperativosApi('/catalogos').then(rows => { const merged = new Map(CONTEXTOS); (rows || []).forEach(row => merged.set(row.Contexto, row.Contexto)); setCatalogContexts([...merged].map(([code, label]) => [code, label])) }).catch(() => {}) }, [isAdmin])
  const updateMotive = async (motive, changes) => {
    setCatalogMessage('')
    try { await eventosOperativosApi(`/motivos/${motive.idMotivoEvento}`, { method: 'PUT', body: JSON.stringify({ ...motive, ...changes }) }); await loadCatalog() }
    catch (e) { setCatalogMessage(e.message || 'No se pudo actualizar la opción.') }
  }

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Operación</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Estadísticas e historial</h1><p className="mt-2 text-gray-600">Los indicadores se calculan con eventos guardados en la API. Cada fila permite revisar los registros que la componen.</p></header>
    <section className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filtros">
      <label className="text-sm font-medium">Desde<input type="date" value={filters.desde} onChange={e => set('desde', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-medium">Hasta<input type="date" value={filters.hasta} onChange={e => set('hasta', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-medium">Proceso<select value={filters.contexto} onChange={e => set('contexto', e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Todos</option>{contexts.map(v => <option key={v} value={v}>{CONTEXTOS.find(([code]) => code === v)?.[1] || v}</option>)}</select></label>
      <label className="text-sm font-medium">Área (código)<input value={filters.area} onChange={e => set('area', e.target.value)} placeholder="ADMINISTRACION" className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-medium">Folio<input value={filters.folio} onChange={e => set('folio', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      {[["empleado", "ID empleado"], ["servicio", "ID servicio"], ["conexion", "ID conexión"], ["medidor", "ID medidor"], ["ruta", "ID ruta"]].map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input type="number" min="1" value={filters[key]} onChange={e => set(key, e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>)}
      <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-5"><input type="checkbox" checked={comparePeriods} onChange={e => setComparePeriods(e.target.checked)} />Comparar con el período inmediatamente anterior de igual duración</label>
      <button type="button" onClick={run} disabled={loading} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50 sm:col-span-2 lg:col-span-5">{loading ? 'Consultando…' : 'Aplicar filtros'}</button>
    </section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {searched && !loading && !rows.length && !error && <p className="card text-gray-600">Sin datos para este período.</p>}
    {rows.length > 0 && <section className="card overflow-x-auto"><p className="mb-3 text-sm text-gray-600">El porcentaje usa como denominador los eventos del mismo contexto y tipo dentro del período y filtros seleccionados.</p>{comparePeriods && <p className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Eventos totales: {rows.reduce((n, r) => n + r.CantidadEventos, 0)} en el período actual y {previousRows.reduce((n, r) => n + r.CantidadEventos, 0)} en el período anterior de igual duración.</p>}<table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">Proceso / evento</th><th className="p-2">Motivo o resultado</th><th className="p-2">Eventos</th><th className="p-2">Operaciones</th><th className="p-2">Registros distintos</th><th className="p-2">Desconocidos</th><th className="p-2">% de eventos</th><th className="p-2"></th></tr></thead><tbody>{rows.map((r, i) => <tr key={`${r.Contexto}-${r.CodigoEvento}-${r.Motivo}-${i}`} className="border-b last:border-0"><td className="p-2"><span className="block font-medium">{r.Contexto}</span><span className="text-xs text-gray-500">{r.CodigoEvento}</span></td><td className="p-2">{r.Motivo || 'Sin motivo registrado'}</td><td className="p-2">{r.CantidadEventos}</td><td className="p-2">{r.CantidadOperaciones}</td><td className="p-2">{r.RegistrosDistintos}</td><td className="p-2">{r.MotivosDesconocidos}</td><td className="p-2">{r.PorcentajeDelEvento}% <span className="text-xs text-gray-500">de {r.DenominadorEventos}</span></td><td className="p-2"><button onClick={() => openRecords(r)} className="font-semibold text-blue-700 hover:underline">Ver origen</button></td></tr>)}</tbody></table></section>}
    {selected && <section className="card space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Registros de {selected.CodigoEvento}</h2><p className="text-sm text-gray-600">{selected.Contexto} · {selected.Motivo || 'Motivo no clasificado'}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2">Cerrar</button></div>{!records.length ? <p className="text-sm text-gray-600">Sin registros disponibles para esos filtros.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">Fecha del evento (UTC)</th><th className="p-2">Entidad / registro</th><th className="p-2">Realizado por</th><th className="p-2">Empleado relacionado</th><th className="p-2">Área</th><th className="p-2">Socio</th><th className="p-2">Medidor</th><th className="p-2">Estado anterior → nuevo</th><th className="p-2">Motivo / resultado</th></tr></thead><tbody>{records.map(r => <tr key={r.idEventoOperativo} className="border-b"><td className="p-2">{new Date(r.FechaEventoUtc).toLocaleString()}</td><td className="p-2">{r.Entidad} · {r.idEntidad}</td><td className="p-2">{r.EmpleadoActor || r.Usuario || (r.ActorSistema ? 'Sistema' : 'Usuario')}</td><td className="p-2">{r.idEmpleado && r.idEmpleado !== r.idEmpleadoActor ? (r.EmpleadoRelacionado || `Empleado #${r.idEmpleado}`) : '-'}</td><td className="p-2">{r.Area || '—'}</td><td className="p-2">{r.idSocio ?? '—'}</td><td className="p-2">{r.idMedidor ?? '—'}</td><td className="p-2">{r.EstadoAnterior || '—'} → {r.EstadoNuevo || '—'}</td><td className="p-2">{r.Motivo || r.Resultado || (r.MotivoDesconocido ? 'Motivo histórico desconocido' : '—')}{r.Detalle ? ` · ${r.Detalle}` : ''}</td></tr>)}</tbody></table></div>}</section>}
    {isAdmin && <section className="card space-y-4"><div><h2 className="text-xl font-bold">Catálogos de motivos</h2><p className="text-sm text-gray-600">Motivos predefinidos para conservar estadísticas comparables. Desde aquí solo se ordenan o activan.</p></div><div className="flex flex-wrap gap-3"><select value={catalogContext} onChange={e => setCatalogContext(e.target.value)} className="rounded-lg border p-2">{catalogContexts.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>{catalogMessage && <p role="status" className="text-sm text-blue-800">{catalogMessage}</p>}<div className="divide-y">{catalog.map(m => <div key={m.idMotivoEvento} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{m.Nombre}</p><p className="text-xs text-gray-500">{m.Codigo} · {m.ConfirmadoCooperativa ? 'Confirmado' : 'Pendiente de validación'} · {m.Activo ? 'Activo' : 'Inactivo'}{m.RequiereDetalle ? ' · detalle obligatorio' : ''}</p></div><div className="flex gap-2"><label className="flex items-center gap-2 text-sm"><span>Orden</span><input type="number" min="0" defaultValue={m.Orden} onBlur={e => { if (Number(e.target.value) !== Number(m.Orden)) updateMotive(m, { Orden: Number(e.target.value) }) }} className="w-16 rounded border p-1" /></label><button onClick={() => updateMotive(m, { Activo: !m.Activo })} className="rounded border px-3 py-1 text-sm">{m.Activo ? 'Desactivar' : 'Reactivar'}</button>{!m.ConfirmadoCooperativa && <button onClick={() => updateMotive(m, { ConfirmadoCooperativa: true })} className="rounded border border-green-300 px-3 py-1 text-sm text-green-800">Confirmar catálogo</button>}</div></div>)}</div></section>}
  </div>
}
