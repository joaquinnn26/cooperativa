import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, RefreshCw } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import useAuthStore from '@/store/authStore.js'
import { normalizeRole } from '@/utils/auth.js'
import { apiLaboralExistente } from '@/utils/laboral.js'
import { eventosOperativosApi } from '@/utils/eventosOperativosApi.js'
import { tieneFuncion } from '@/utils/laboralPermissions.js'

const COLORS = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#65a30d']
const AREA_NAMES = { ADMINISTRACION: 'Administración', AGUA: 'Agua potable', ENERGIA: 'Electricidad', INTERNET: 'Internet', GAS: 'Gas', GERENCIA: 'Gerencia', SIN_AREA: 'Sin área' }
const STATE_NAMES = { PendienteAsignacion: 'Pendiente de asignar', Asignada: 'Asignada', EnCurso: 'En curso', EnRevision: 'En revisión', Observada: 'Devuelta', Aprobada: 'Aprobada', Rechazada: 'Rechazada', Cerrada: 'Cerrada', PendienteDocumentacion: 'Falta documentación', Recibida: 'Recibida', 'En Revision': 'En revisión', Pagada: 'Pagada', Pendiente: 'Pendiente', Anulada: 'Anulada', Exportado: 'Sin respuesta', Validado: 'Validado', Aplicado: 'Aplicado', FACTURADA: 'Facturada', RECHAZADA: 'Rechazada', 'Sin respuesta': 'Sin respuesta' }
const EVENT_NAMES = { Aprobar: 'Aprobaciones', Rechazar: 'Rechazos', Devolver: 'Devoluciones', CorregirLectura: 'Correcciones', RegistrarLectura: 'Lecturas registradas', IncidenciaRuta: 'Incidencias de visita', SolicitudRechazada: 'Solicitudes rechazadas', AltaSocioRechazada: 'Altas rechazadas' }
const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const labelArea = value => AREA_NAMES[value] || value || 'Sin área'
const labelState = value => STATE_NAMES[value] || value || 'Sin estado'
const pct = value => value == null ? 'Porcentaje no disponible' : `${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`

function EmptyChart({ children }) { return <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-600">{children}</div> }
function ChartPanel({ title, period, description, children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{period}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div>{children}</section>
}

export default function EventosEstadisticas() {
  const role = useAuthStore(s => s.rol)
  const areas = useAuthStore(s => s.areas) || []
  const isAdmin = normalizeRole(role) === 'Administrador'
  const isManager = isAdmin || tieneFuncion(areas, 'GERENCIA', 'CONSULTA_GENERAL')
  const [area, setArea] = useState('')
  const [areaOptions, setAreaOptions] = useState([])
  const [data, setData] = useState(null)
  const [records, setRecords] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(''); setRecords([]); setSelected(null)
    try {
      const query = isManager && area ? `?area=${encodeURIComponent(area)}` : ''
      setData(await eventosOperativosApi(`/dashboard${query}`))
    } catch (e) { setError(e.message || 'No se pudieron cargar las estadísticas.') } finally { setLoading(false) }
  }, [area, isManager])

  useEffect(() => {
    if (!isManager) return
    const loadAreas = async () => {
      try {
        const result = isAdmin ? await apiLaboralExistente('/laboral/configuracion') : await apiLaboralExistente('/laboral/resumen')
        setAreaOptions((isAdmin ? result.areas : result).map(x => ({ Codigo: x.Codigo || x.Area, Nombre: x.Nombre })))
      } catch { setAreaOptions([]) }
    }
    loadAreas()
  }, [isAdmin, isManager])

  useEffect(() => { load() }, [load])

  const stateData = useMemo(() => {
    const grouped = new Map()
    for (const item of [...(data?.estadosTareas || []), ...(data?.estadosProcesos || [])]) {
      const name = `${item.Proceso} · ${labelArea(item.Area)}`
      const row = grouped.get(name) || { name }
      row[labelState(item.Estado)] = (row[labelState(item.Estado)] || 0) + Number(item.Cantidad || 0)
      grouped.set(name, row)
    }
    return [...grouped.values()]
  }, [data])
  const stateKeys = useMemo(() => [...new Set(stateData.flatMap(row => Object.keys(row).filter(k => k !== 'name')))], [stateData])

  const todayData = useMemo(() => (data?.actividadHoy || []).filter(x => !data?.area || x.Area === data.area).map(x => ({ ...x, name: `${EVENT_NAMES[x.CodigoEvento] || x.CodigoEvento} · ${labelArea(x.Area)}`, value: Number(x.Cantidad) })), [data])
  const motiveData = useMemo(() => (data?.motivosMes || data?.motivosDocumentacionMes || []).filter(x => !data?.area || x.Area === data.area).slice(0, 30).map(x => ({ ...x, name: `${x.Motivo} · ${labelArea(x.Area)}`, value: Number(x.Cantidad), porcentaje: x.Denominador ? Number(x.Cantidad) * 100 / Number(x.Denominador) : null })), [data])
  const qualityData = useMemo(() => (data?.indicadoresCalidad || []).filter(x => !data?.area || x.Area === data.area).map(x => ({ ...x, name: `${x.Proceso} · ${EVENT_NAMES[x.Resultado] || labelState(x.Resultado)} · ${labelArea(x.Area)}`, value: Number(x.Cantidad), porcentaje: x.Porcentaje == null ? null : Number(x.Porcentaje) })), [data])
  const ageData = useMemo(() => (data?.pendientesAntiguedad || []).filter(x => !data?.area || x.Area === data.area).map(x => ({ ...x, name: `${x.Proceso} · ${labelArea(x.Area)} · ${x.Rango}`, value: Number(x.Cantidad) })), [data])
  const flowData = useMemo(() => {
    const rows = new Map()
    for (const item of data?.semanasFlujo || []) {
      const date = new Date(item.Semana)
      const key = date.toISOString().slice(0, 10)
      const row = rows.get(key) || { key, semana: date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) }
      const series = `${item.Proceso} · ${item.Tipo}`
      row[series] = (row[series] || 0) + Number(item.Cantidad)
      rows.set(key, row)
    }
    return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [data])
  const flowSeries = useMemo(() => [...new Set((data?.semanasFlujo || []).map(x => `${x.Proceso} · ${x.Tipo}`))], [data])
  const repeatData = useMemo(() => (data?.medidoresRecurrentes || []).filter(x => !data?.area || x.Area === data.area).map(x => ({ ...x, name: labelArea(x.Area), value: Number(x.Cantidad) })), [data])
  const focusArea = data?.esGerencia ? data.area : data?.areasPermitidas?.length === 1 ? data.areasPermitidas[0] : null
  const focusedStateData = useMemo(() => {
    const rows = new Map()
    for (const item of [...(data?.estadosTareas || []), ...(data?.estadosProcesos || [])].filter(x => x.Area === focusArea)) {
      const name = item.Proceso
      const row = rows.get(name) || { name }
      row[labelState(item.Estado)] = (row[labelState(item.Estado)] || 0) + Number(item.Cantidad || 0)
      rows.set(name, row)
    }
    return [...rows.values()]
  }, [data, focusArea])
  const focusedStateKeys = useMemo(() => [...new Set(focusedStateData.flatMap(row => Object.keys(row).filter(k => k !== 'name')))], [focusedStateData])
  const focusedAge = useMemo(() => ageData.filter(x => x.Area === focusArea), [ageData, focusArea])
  const focusedFlow = useMemo(() => {
    const rows = new Map()
    for (const item of (data?.semanasFlujo || []).filter(x => x.Area === focusArea)) {
      const date = new Date(item.Semana); const key = date.toISOString().slice(0, 10)
      const row = rows.get(key) || { key, semana: date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) }
      row[item.Tipo] = (row[item.Tipo] || 0) + Number(item.Cantidad || 0); rows.set(key, row)
    }
    return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [data, focusArea])
  const focusedMotives = useMemo(() => motiveData.filter(x => x.Area === focusArea), [motiveData, focusArea])
  const focusedQuality = useMemo(() => qualityData.filter(x => x.Area === focusArea), [qualityData, focusArea])
  const focusedToday = useMemo(() => todayData.filter(x => x.Area === focusArea), [todayData, focusArea])
  const focusedIncidentMotives = useMemo(() => (data?.motivosIncidenciasAbiertas || []).filter(x => x.Area === focusArea).map(x => ({ ...x, name: x.Motivo, value: Number(x.Cantidad) })), [data, focusArea])
  const focusedRepeat = useMemo(() => (data?.medidoresRecurrentes || []).filter(x => x.Area === focusArea).map(x => ({ ...x, name: labelArea(x.Area), value: Number(x.Cantidad) })), [data, focusArea])
  const focusedResolution = useMemo(() => (data?.tiemposResolucionPorMotivo || []).filter(x => x.Area === focusArea).map(x => ({ ...x, name: x.Motivo, value: Number(x.HorasPromedio) })), [data, focusArea])
  const focusedInvoiceStates = useMemo(() => focusedStateData.find(x => x.name === 'Facturación Internet') || null, [focusedStateData])
  const focusedInvoiceKeys = useMemo(() => focusedInvoiceStates ? Object.keys(focusedInvoiceStates).filter(k => k !== 'name') : [], [focusedInvoiceStates])

  const trend = useMemo(() => {
    if (!data?.periodos) return { rows: [], series: [], coverageKey: '' }
    const start = new Date(`${data.periodos.tendenciaDesdeLocal.slice(0, 10)}T12:00:00`)
    const currentMonthKey = monthKey(new Date(`${data.periodos.mesDesdeLocal.slice(0, 10)}T12:00:00`))
    const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(start); d.setMonth(d.getMonth() + i); return monthKey(d) })
    const byMonth = new Map(months.map(m => [m, { key: m, name: new Date(`${m}-01T12:00:00`).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }) + (m === currentMonthKey ? ' · parcial' : '') }]))
    const managerAll = data.esGerencia && !data.area
    const countBySeries = new Map()
    const visibleTrends = (data.tendencias || []).filter(item => !data.esGerencia || data.area || data.areasPermitidas?.includes(item.Area))
    for (const item of visibleTrends) {
      const key = monthKey(new Date(item.Periodo))
      const series = managerAll ? labelArea(item.Area) : item.Contexto
      const row = byMonth.get(key)
      if (!row) continue
      row[series] = (row[series] || 0) + Number(item.Cantidad || 0)
      countBySeries.set(series, (countBySeries.get(series) || 0) + Number(item.Cantidad || 0))
    }
    const allSeries = [...countBySeries].sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0])
    const coverageKey = data.coberturaEventosDesdeUtc ? monthKey(new Date(data.coberturaEventosDesdeUtc)) : ''
    const rows = [...byMonth.values()].map(row => { for (const s of allSeries) if (coverageKey && row.key < coverageKey) row[s] = null; return row })
    return { rows, series: allSeries, coverageKey }
  }, [data])

  async function openRecords(event) {
    if (!event?.desde || !event?.hasta || !data?.periodos) return
    setSelected(event); setRecords([]); setError('')
    try {
      const q = new URLSearchParams({ DesdeUtc: event.desde, HastaUtc: event.hasta })
      if (event.Contexto) q.set('contexto', event.Contexto)
      if (event.CodigoEvento) q.set('codigoEvento', event.CodigoEvento)
      if (event.idMotivoEvento) q.set('idMotivoEvento', event.idMotivoEvento)
      if (isManager && (event.Area || data.area)) q.set('Area', event.Area || data.area)
      const result = await eventosOperativosApi(`/registros?${q}`)
      setRecords(result.items || [])
    } catch (e) { setError(e.message || 'No se pudieron abrir los registros asociados.') }
  }

  const eventsTodayClick = point => { const p = data?.periodos; if (point?.payload && p) openRecords({ ...point.payload, desde: p.hoyDesdeUtc, hasta: p.hoyHastaUtcExclusivo }) }
  const motivesClick = point => { const p = data?.periodos; if (point?.payload && p) openRecords({ ...point.payload, desde: p.mesDesdeUtc, hasta: p.mesHastaUtcExclusivo }) }
  const trendClick = point => { const p = data?.periodos; if (point?.payload && p) { const from = new Date(`${point.payload.key}-01T00:00:00Z`); const to = new Date(from); to.setUTCMonth(to.getUTCMonth() + 1); openRecords({ Contexto: data.esGerencia && !data.area ? null : point.dataKey, Area: data.esGerencia && !data.area ? point.dataKey : data.area, desde: from.toISOString(), hasta: to.toISOString() }) } }

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 p-7 text-white shadow-lg">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-200">Panel gráfico de gestión</p><h1 className="mt-2 text-3xl font-bold">Estadísticas e historial</h1><p className="mt-2 max-w-3xl text-sm text-blue-100">Trabajo, estados, causas y tendencias construidos a partir de eventos registrados y estados vigentes.</p></div>
      <div className="grid gap-2 text-right"><span className="text-xs text-blue-100">Actualizado: {data?.actualizadoUtc ? new Date(data.actualizadoUtc).toLocaleString('es-AR') : 'cargando'}</span><button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>Actualizar</button></div>
      {isManager && <label className="grid gap-1 text-sm font-semibold">Área<select className="min-w-56 rounded-xl border border-white/30 bg-slate-900 px-3 py-2 text-white" value={area} onChange={e => setArea(e.target.value)}><option value="">Todas las áreas</option>{areaOptions.map(x => <option key={x.Codigo} value={x.Codigo}>{x.Nombre}</option>)}</select></label>}
    </header>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {loading && <p role="status" className="rounded-xl bg-slate-50 p-5 text-slate-600">Calculando los gráficos según tus permisos…</p>}
    {data && <>
      {focusArea && <section className="space-y-4"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Panel del área</p><h2 className="text-2xl font-bold text-slate-900">Indicadores de {labelArea(focusArea)}</h2><p className="text-sm text-slate-600">Métricas seleccionadas para el trabajo y las decisiones de esta área.</p></div><div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Estados de los procesos" period="Situación actual" description="Casos actuales por proceso y estado; sirve para localizar acumulaciones y cuellos de botella.">
          {focusedStateData.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={focusedStateData} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={150}/><Tooltip/><Legend/>{focusedStateKeys.map((key,i)=><Bar key={key} dataKey={key} stackId="s" fill={COLORS[i%COLORS.length]}/>)}</BarChart></ResponsiveContainer> : <EmptyChart>Este módulo aún no tiene registros para mostrar estados.</EmptyChart>}
        </ChartPanel>
        <ChartPanel title="Trabajo recibido y resuelto" period="Semanas · últimos 12 meses" description="Entradas frente a resoluciones. Permite observar si el volumen que ingresa supera la capacidad de resolución.">
          {focusedFlow.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={focusedFlow}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="semana"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="Recibidos" fill="#2563eb"/><Bar dataKey="Resueltos" fill="#0f766e"/></BarChart></ResponsiveContainer> : <EmptyChart>Falta historial de creación y resolución para comparar entradas y salidas.</EmptyChart>}
        </ChartPanel>
        <ChartPanel title="Pendientes por antigüedad" period="Situación actual" description="Casos abiertos por días desde su creación. Ayuda a priorizar expedientes y tareas demoradas.">
          {focusedAge.length ? <ResponsiveContainer width="100%" height={Math.max(240,focusedAge.length*34)}><BarChart data={focusedAge} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={210} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="value" fill="#d97706" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer> : <EmptyChart>No hay pendientes con fechas de creación en esta área.</EmptyChart>}
        </ChartPanel>
        <ChartPanel title="Actividad diaria" period="Hoy" description="Eventos registrados hoy en el ?rea; permite monitorear el movimiento operativo diario.">
          {focusedToday.length ? <ResponsiveContainer width="100%" height={Math.max(240,focusedToday.length*34)}><BarChart data={focusedToday} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={220} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="value" fill="#0f766e"/></BarChart></ResponsiveContainer> : <EmptyChart>Hoy no se registraron eventos para esta área.</EmptyChart>}
        </ChartPanel>
        {focusArea === 'ADMINISTRACION' && <>
          <ChartPanel title="Motivos de rechazo documental" period="Mes actual · hasta hoy" description="Causas del catálogo ligadas a documentos rechazados; ayuda a detectar requisitos que generan más devoluciones.">
            {focusedMotives.filter(x=>x.Contexto==='DOCUMENTO_PERSONA_RECHAZO').length ? <ResponsiveContainer width="100%" height={280}><BarChart data={focusedMotives.filter(x=>x.Contexto==='DOCUMENTO_PERSONA_RECHAZO')} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="Motivo" width={220} tick={{fontSize:11}}/><Tooltip formatter={(v,n,p)=>[`${v} ? ${pct(p.payload.porcentaje)} de rechazos`,n]}/><Bar dataKey="value" fill="#dc2626"/></BarChart></ResponsiveContainer> : <EmptyChart>Sin rechazos documentales con motivo catalogado en el mes.</EmptyChart>}
          </ChartPanel>
          <ChartPanel title="Decisiones de revisión" period="Mes actual · hasta hoy" description="Aprobaciones, rechazos y devoluciones en las revisiones registradas, para seguir la calidad de la documentación recibida.">
            {focusedQuality.filter(x=>x.Proceso==='Documentaci?n').length ? <div className="space-y-3">{focusedQuality.filter(x=>x.Proceso==='Documentaci?n').map((x,i)=><div key={x.Resultado} className="rounded-xl border p-3"><div className="flex justify-between text-sm"><b>{labelState(x.Resultado)}</b><b>{x.value} ? {pct(x.porcentaje)}</b></div><div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full" style={{width:`${Math.min(100,Number(x.porcentaje||0))}%`,background:COLORS[i%COLORS.length]}}/></div><small className="text-slate-500">Denominador: {x.Denominador} decisiones del período.</small></div>)}</div> : <EmptyChart>No hay historial suficiente de decisiones para calcular calidad de revisión.</EmptyChart>}
          </ChartPanel>
        </>}
        {(focusArea==='AGUA'||focusArea==='ENERGIA') && <>
          <ChartPanel title="Correcciones de lecturas" period="Mes actual · hasta hoy" description="Correcciones registradas; la comparación es con lecturas del período sin corrección. Una corrección no se cuenta como lectura omitida.">
            {focusedQuality.filter(x=>x.Proceso==='Correcciones de lectura').length ? <div className="space-y-3">{focusedQuality.filter(x=>x.Proceso==='Correcciones de lectura').map(x=><div key={x.Area} className="rounded-xl border p-3"><b>{x.value} correcciones ? {pct(x.porcentaje)}</b><div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-amber-500" style={{width:`${Math.min(100,Number(x.porcentaje||0))}%`}}/></div><small className="text-slate-500">Denominador: {x.Denominador ?? 'no disponible'} lecturas del período.</small></div>)}</div> : <EmptyChart>Sin correcciones registradas este mes; el sistema no las confunde con lecturas omitidas.</EmptyChart>}
          </ChartPanel>
          <ChartPanel title="Motivos de incidencias abiertas" period="Situación actual" description="Motivos técnicos de los medidores todav?a sin resolución; orienta mantenimiento y reposición.">
            {focusedIncidentMotives.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={focusedIncidentMotives} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={210}/><Tooltip/><Bar dataKey="value" fill="#d97706"/></BarChart></ResponsiveContainer> : <EmptyChart>Sin incidencias abiertas con motivo registrado.</EmptyChart>}
          </ChartPanel>
          <ChartPanel title="Medidores con incidencias recurrentes" period="últimos 12 meses" description="Medidores ?nicos con m?s de una incidencia t?cnica en una ventana m?vil de 12 meses.">
            {focusedRepeat.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={focusedRepeat}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#dc2626"/></BarChart></ResponsiveContainer> : <EmptyChart>Sin reincidencias identificadas en medidores.</EmptyChart>}
          </ChartPanel>
          <ChartPanel title="Tiempo de resolución por motivo" period="Resoluciones del mes actual" description="Horas promedio hasta reparar o reemplazar; ayuda a reconocer incidencias que tardan m?s en resolverse.">
            {focusedResolution.length ? <ResponsiveContainer width="100%" height={Math.max(240,focusedResolution.length*34)}><BarChart data={focusedResolution} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number"/><YAxis type="category" dataKey="name" width={210}/><Tooltip formatter={v=>[`${Number(v).toFixed(1)} horas`, 'Promedio']}/><Bar dataKey="value" fill="#7c3aed"/></BarChart></ResponsiveContainer> : <EmptyChart>Sin incidencias resueltas con fechas de apertura y cierre durante el mes.</EmptyChart>}
          </ChartPanel>
        </>}
        {(focusArea==='GAS'||focusArea==='GERENCIA') && <ChartPanel title="Motivos de decisiones del área" period="Mes actual · hasta hoy" description="Causas registradas en aprobaciones, rechazos y devoluciones. Sirve para identificar problemas repetidos que requieren cambios de proceso.">
          {focusedMotives.length ? <ResponsiveContainer width="100%" height={Math.max(240,focusedMotives.length*34)}><BarChart data={focusedMotives} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={240} tick={{fontSize:11}}/><Tooltip formatter={(v,n,p)=>[`${v} ? ${pct(p.payload.porcentaje)} de su tipo de decisi?n`,n]}/><Bar dataKey="value" fill="#7c3aed"/></BarChart></ResponsiveContainer> : <EmptyChart>Este mes no hay motivos registrados para las decisiones de esta ?rea.</EmptyChart>}
        </ChartPanel>}
        {focusArea==='INTERNET' && <>
          <ChartPanel title="Resultado de facturación externa" period="Período operativo actual" description="Filas del lote de Internet facturadas frente a rechazadas o pendientes de respuesta; permite detectar problemas del intercambio de archivos.">
            {focusedInvoiceStates ? <ResponsiveContainer width="100%" height={250}><BarChart data={[focusedInvoiceStates]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" hide/><YAxis allowDecimals={false}/><Tooltip/><Legend/>{focusedInvoiceKeys.map((key,i)=><Bar key={key} dataKey={key} stackId="s" fill={COLORS[i%COLORS.length]}/>)}</BarChart></ResponsiveContainer> : <EmptyChart>No hay filas de facturación de Internet en el período operativo actual.</EmptyChart>}
          </ChartPanel>
          <ChartPanel title="Motivos de rechazo de facturas" period="Mes actual · hasta hoy" description="Motivos informados en respuestas de lotes externos; la fuente es la respuesta del sistema de facturación.">
            {focusedMotives.filter(x=>x.Contexto==='INTERNET_FACTURACION').length ? <ResponsiveContainer width="100%" height={260}><BarChart data={focusedMotives.filter(x=>x.Contexto==='INTERNET_FACTURACION')} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="Motivo" width={220} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="value" fill="#dc2626"/></BarChart></ResponsiveContainer> : <EmptyChart>Sin motivos de rechazo importados en los lotes de este período.</EmptyChart>}
          </ChartPanel>
        </>}
      </div></section>}
      {!focusArea && <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Pendientes por antigüedad" period="Situación actual · casos abiertos" description="Casos únicos por edad desde su creación. Los rangos describen antigüedad; no indican vencimiento ni cumplimiento de plazo.">
          {ageData.length ? <ResponsiveContainer width="100%" height={Math.max(260, ageData.length * 34)}><BarChart data={ageData} layout="vertical" margin={{ left: 12, right: 16 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11 }}/><Tooltip formatter={v => [`${v} casos`, 'Pendientes']}/><Bar dataKey="value" name="Casos abiertos" fill="#d97706" radius={[0, 6, 6, 0]}/></BarChart></ResponsiveContainer> : <EmptyChart>No hay tareas abiertas con datos de antigüedad dentro de tu alcance.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Casos recibidos y resueltos" period="Semanas · últimos 12 meses" description="Recibidos: evento de creación de tarea o solicitud. Resueltos: transición a estado final. Se cuentan eventos/casos de cada semana, no el pendiente acumulado histórico.">
          {flowData.length ? <ResponsiveContainer width="100%" height={320}><BarChart data={flowData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="semana"/><YAxis allowDecimals={false}/><Tooltip formatter={v => [`${v} casos`, '']}/><Legend/>{flowSeries.map((key, i) => <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]}/>)}</BarChart></ResponsiveContainer> : <EmptyChart>No hay historial suficiente de entradas y resoluciones para este período.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Medidores con incidencias recurrentes" period="Últimos 12 meses" description="Cantidad de medidores únicos que tuvieron un evento de medidor y ya tenían otro evento previo en una ventana móvil de 12 meses. Un medidor recurrente se cuenta una sola vez.">
          {repeatData.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={repeatData} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={150}/><Tooltip formatter={v => [`${v} medidores únicos`, 'Recurrentes']}/><Bar dataKey="value" name="Medidores recurrentes" fill="#dc2626" radius={[0, 6, 6, 0]}/></BarChart></ResponsiveContainer> : <EmptyChart>No hay activos con incidencias repetidas identificables en este período.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Motivos de incidencias abiertas" period="Situación actual" description="Incidencias activas por motivo técnico del catálogo de medidores. Cada incidencia abierta se cuenta una vez.">
          {data.motivosIncidenciasAbiertas?.length ? <ResponsiveContainer width="100%" height={Math.max(240, data.motivosIncidenciasAbiertas.length * 34)}><BarChart data={data.motivosIncidenciasAbiertas.map(x => ({ ...x, name: `${x.Motivo} · ${labelArea(x.Area)}`, value: Number(x.Cantidad) }))} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }}/><Tooltip formatter={v => [`${v} casos abiertos`, 'Incidencias']}/><Bar dataKey="value" name="Abiertas" fill="#d97706" radius={[0, 6, 6, 0]}/></BarChart></ResponsiveContainer> : <EmptyChart>Sin incidencias abiertas con motivo identificable. El historial enlazado se habilita con la migración de incidencias.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Tiempo de resolución por motivo" period="Resoluciones del mes actual" description="Horas desde la apertura hasta la reparación o reemplazo. Se muestran casos cerrados durante el mes; no mide incidencias aún abiertas.">
          {data.tiemposResolucionPorMotivo?.length ? <ResponsiveContainer width="100%" height={Math.max(240, data.tiemposResolucionPorMotivo.length * 38)}><BarChart data={data.tiemposResolucionPorMotivo.map(x => ({ ...x, name: `${x.Motivo} · ${labelArea(x.Area)}`, promedio: Number(x.HorasPromedio), casos: Number(x.Casos) }))} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number"/><YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }}/><Tooltip formatter={(v, n, p) => n === 'Horas promedio' ? [`${Number(v).toFixed(1)} h · ${p.payload.casos} casos`, n] : [v, n]}/><Bar dataKey="promedio" name="Horas promedio" fill="#7c3aed" radius={[0, 6, 6, 0]}/></BarChart></ResponsiveContainer> : <EmptyChart>Sin incidencias resueltas este mes con fechas de apertura y cierre enlazadas.</EmptyChart>}
        </ChartPanel>
        <ChartPanel title="Actividad: mismo tramo del mes anterior" period="Mes actual vs. período comparable" description={`Compara eventos registrados hasta hoy con el mismo número de días del mes anterior (${data.periodos.comparacionDesdeLocal.slice(0, 10)} a ${data.periodos.comparacionHastaLocalExclusivo.slice(0, 10)}). Unidades: eventos, no casos únicos.`}>
          {data.comparacionMensualEventos?.some(x => Number(x.Cantidad) > 0) ? <ResponsiveContainer width="100%" height={260}><BarChart data={data.comparacionMensualEventos.map(x => ({ name: x.Periodo, cantidad: Number(x.Cantidad) }))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip formatter={v => [`${v} eventos`, 'Cantidad']}/><Bar dataKey="cantidad" name="Eventos registrados" fill="#0f766e" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer> : <EmptyChart>Sin datos de eventos para el período seleccionado.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Decisiones y estados actuales" period="Situación actual" description="Tareas, altas, documentos, solicitudes, mediciones, medidores y facturas según los estados que conserva cada módulo.">
          {stateData.length ? <ResponsiveContainer width="100%" height={350}><BarChart data={stateData} layout="vertical" margin={{ left: 24, right: 18 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={175} tick={{ fontSize: 11 }}/><Tooltip formatter={(v, k) => [v, k]}/><Legend/>{stateKeys.map((key, i) => <Bar key={key} dataKey={key} stackId="states" fill={COLORS[i % COLORS.length]} />)}</BarChart></ResponsiveContainer> : <EmptyChart>No hay estados disponibles dentro de tu alcance.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Actividad registrada" period="Hoy" description="Cantidad de eventos registrados por tipo. Al hacer clic se abren los eventos de ese tipo y período.">
          {todayData.length ? <ResponsiveContainer width="100%" height={350}><BarChart data={todayData} layout="vertical" margin={{ left: 15, right: 18 }} onClick={e => eventsTodayClick(e?.activePayload?.[0])}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }}/><Tooltip/><Bar dataKey="value" name="Eventos" fill="#0f766e" cursor="pointer" radius={[0, 6, 6, 0]}/></BarChart></ResponsiveContainer> : <EmptyChart>No hay eventos registrados hoy dentro de tu alcance. El gráfico aparecerá cuando se registren.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Motivos más frecuentes" period="Mes actual · hasta hoy" description="Barras ordenadas. El porcentaje usa decisiones del mismo flujo y período: tareas por acción, documentación sobre rechazos, y facturación por filas recibidas en los lotes del período. Los motivos heredados sin equivalencia confirmada se identifican aparte.">
          {motiveData.length ? <ResponsiveContainer width="100%" height={Math.max(300, motiveData.length * 42)}><BarChart data={motiveData} layout="vertical" margin={{ left: 12, right: 42 }} onClick={e => motivesClick(e?.activePayload?.[0])}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={250} tick={{ fontSize: 11 }}/><Tooltip formatter={(value, _name, props) => [`${value} · ${pct(props.payload.porcentaje)} del mismo tipo de evento`, 'Casos']}/><Bar dataKey="value" name="Casos" fill="#2563eb" cursor="pointer" radius={[0, 6, 6, 0]}>{motiveData.map((x, i) => <Cell key={`${x.idMotivoEvento}-${i}`} fill={x.MotivoDesconocido ? '#b45309' : COLORS[i % COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer> : <EmptyChart>Este mes no hay motivos registrados para tu alcance. No se muestra una distribución vacía como si fuera un resultado.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Tendencia de actividad" period="Últimos 12 meses" description={`Eventos registrados por ${data.esGerencia && !data.area ? 'área' : 'proceso'}. El mes actual es parcial. La cobertura histórica comienza ${trend.coverageKey || 'cuando exista el primer evento'}.`}>
          {trend.series.length ? <ResponsiveContainer width="100%" height={350}><LineChart data={trend.rows} margin={{ left: 0, right: 15, top: 12 }} onClick={e => trendClick(e?.activePayload?.[0])}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Legend/>{trend.series.map((key, i) => <Line key={key} type="monotone" dataKey={key} connectNulls={false} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }}/>)}</LineChart></ResponsiveContainer> : <EmptyChart>No hay suficiente historial de eventos para construir una tendencia. No se completan meses anteriores con ceros.</EmptyChart>}
        </ChartPanel>

        <ChartPanel title="Rechazos, devoluciones y correcciones" period="Mes actual · hasta hoy" description="Cantidad y porcentaje sobre las decisiones del flujo. Las correcciones de lectura se comparan con mediciones del período que no fueron corregidas y se distinguen de lecturas no realizadas.">
          {qualityData.length ? <div className="space-y-4">{qualityData.map((item, i) => <div key={`${item.Proceso}-${item.Resultado}-${item.Area}`} className="rounded-xl border border-slate-200 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold">{item.name}</span><b>{item.value} {item.Denominador != null ? `· ${pct(item.porcentaje)}` : ''}</b></div>{item.Denominador != null ? <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.porcentaje || 0))}%`, background: COLORS[i % COLORS.length] }}/></div> : <p className="text-xs text-amber-800">Hay fecha y motivo actual, pero falta historial para calcular un porcentaje fiable.</p>}<p className="mt-1 text-xs text-slate-500">{item.Denominador != null ? `Denominador: ${item.Denominador} decisiones/lecturas/respuestas del flujo y período correspondiente.` : 'Porcentaje no calculado.'}</p>{item.Contexto && <button onClick={() => openRecords({ Contexto: item.Contexto, desde: data.periodos.mesDesdeUtc, hasta: data.periodos.mesHastaUtcExclusivo })} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">Abrir eventos relacionados</button>}</div>)}</div> : <EmptyChart>No hay decisiones o correcciones registradas este mes dentro de tu alcance.</EmptyChart>}
        </ChartPanel>
      </div>}

      {data.coberturaEventosDesdeUtc && <p className="text-xs text-slate-500">La bitácora disponible para este alcance comienza el {new Date(data.coberturaEventosDesdeUtc).toLocaleDateString('es-AR')}. Los meses anteriores quedan fuera de cobertura.</p>}

      {selected && <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Eventos asociados</h2><p className="text-sm text-slate-600">{selected.Contexto} · {selected.CodigoEvento || selected.Motivo || 'Período seleccionado'}</p></div><button onClick={() => { setSelected(null); setRecords([]) }} className="rounded-lg border px-3 py-2 text-sm">Cerrar detalle</button></div>{records.length ? <div className="mt-4 max-h-96 overflow-auto"><ul className="space-y-2">{records.map(x => <li key={x.idEventoOperativo} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{new Date(x.FechaEventoUtc).toLocaleString('es-AR')}</b><span> · {x.EmpleadoActor || x.Usuario || 'Sistema'} · {labelArea(x.Area)}</span><p className="mt-1 text-slate-600">{x.EstadoAnterior || '—'} → {x.EstadoNuevo || x.Resultado || '—'}{x.Motivo ? ` · ${x.Motivo}` : ''}</p><span className="text-xs text-slate-500">{x.Entidad} #{x.idEntidad}</span></li>)}</ul></div> : <EmptyChart>El registro no tiene eventos asociados en la bitácora disponible.</EmptyChart>}</section>}
    </>}
  </main>
}
