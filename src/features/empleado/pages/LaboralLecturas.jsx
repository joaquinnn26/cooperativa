import React, { useEffect, useRef, useState } from 'react'
import {useSearchParams} from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Gauge, History, Info, Loader2, PencilLine, RefreshCw, Search, X } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { laboralApi } from '@/utils/laboral.js'
import { confirmAction, showInfo, showToast } from '@/utils/alerts.js'
import './LaboralLecturas.css'
import LecturaEvidencia from './LecturaEvidencia.jsx'

const number = value => value == null || value === '' ? 'Sin registrar' : Number(value).toLocaleString('es-AR', { maximumFractionDigits: 3 })
// FechaLectura es una fecha calendario, aunque la API la serialice con sufijo UTC.
const day = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Sin fecha'
}
const moment = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('es-AR') : 'Fecha no disponible'
const snapshot = value => { try { return typeof value === 'string' ? JSON.parse(value) : value } catch { return null } }

export default function LaboralLecturas() {
  const [params,setParams]=useSearchParams()
  const linkedArea=params.get('area'),routeId=/^[1-9]\d*$/.test(params.get('ruta')||'')?params.get('ruta'):null
  const linkedReading=/^[1-9]\d*$/.test(params.get('lectura')||'')?params.get('lectura'):null
  const [linkError,setLinkError]=useState(''),[opening,setOpening]=useState(false)
  const profile = useAuthStore(s => s.areas)
  const areas = (profile || []).filter(a => a.Encargado && ['AGUA', 'ENERGIA'].includes(a.Area))
  const [area, setArea] = useState(''), [search, setSearch] = useState(''), [query, setQuery] = useState('')
  const [connection, setConnection] = useState(null), [page, setPage] = useState(1), [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState(null)
  const allowed = areas.some(a => a.Area === area)
  useEffect(() => {
    const linked=areas.find(a=>a.Area===linkedArea)?.Area
    if ((linked&&linked!==area)||!areas.some(a => a.Area === area)) { setArea(linked||areas[0]?.Area || ''); setPage(1); setConnection(null) }
  }, [profile, area,linkedArea])
  useEffect(()=>{
    if(!allowed||!linkedReading||(linkedArea&&linkedArea!==area))return
    const abort=new AbortController();setOpening(true);setLinkError('');setSelected(null)
    laboralApi(`/lecturas?area=${encodeURIComponent(area)}&lectura=${linkedReading}${routeId?`&ruta=${routeId}`:''}`,{signal:abort.signal})
      .then(data=>{if(!abort.signal.aborted){if(!data[0])setLinkError('La lectura no está disponible para este recorrido o área.');else setSelected(data[0])}})
      .catch(e=>{if(!abort.signal.aborted)setLinkError(e.message)})
      .finally(()=>{if(!abort.signal.aborted)setOpening(false)})
    return()=>abort.abort()
  },[allowed,area,linkedArea,linkedReading,routeId])
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])
  useEffect(() => {
    if (!allowed) return
    const abort = new AbortController()
    setLoading(true); setError(''); setRows([])
    laboralApi(`/lecturas?area=${encodeURIComponent(area)}&pagina=${page}&q=${encodeURIComponent(query)}${routeId?`&ruta=${routeId}`:''}${connection ? `&conexion=${connection.id}` : ''}`, { signal: abort.signal })
      .then(data => { if (!abort.signal.aborted) setRows(data) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [area, allowed, query, connection, page, revision,routeId])
  const unit = area === 'AGUA' ? 'm³' : 'kWh'
  const searching = search.trim() !== query
  return <section className="reading-review">
    <header className="rr-hero"><span className="rr-hero-icon"><ClipboardCheck size={29} /></span><div><small>CONTROL DE MEDICIONES · {area === 'AGUA' ? 'AGUA POTABLE' : area === 'ENERGIA' ? 'ENERGÍA' : 'MI ÁREA'}</small><h1>Revisión de lecturas</h1><p>Consultá una medición, verificá sus datos y corregila con un motivo cuando sea necesario.</p></div><button type="button" className="rr-refresh" aria-label="Actualizar lecturas" disabled={loading || !allowed} onClick={() => setRevision(r => r + 1)}><RefreshCw size={18} className={loading ? 'rr-spin' : ''} /><span>Actualizar</span></button></header>
    <div className="rr-guide"><span><b>1</b> Buscá al socio o medidor</span><ArrowRight size={15} /><span><b>2</b> Abrí la lectura</span><ArrowRight size={15} /><span><b>3</b> Verificá la foto y aprobá</span></div>
    {routeId&&<div className="rr-connection"><History size={17}/><span>Lecturas del recorrido #{routeId}</span><button type="button" onClick={()=>{setParams(area?{area}:{});setPage(1);setSelected(null);setLinkError('')}}>Ver todos los recorridos <X size={14}/></button></div>}
    {opening&&<p className="rr-description" role="status">Abriendo la lectura seleccionada…</p>}{linkError&&<p className="rr-warning" role="alert">{linkError}</p>}
    {!areas.length ? <div className="rr-empty"><Info size={30} /><h2>Esta vista corresponde al encargado</h2><p>Necesitás una asignación como encargado de Agua o Energía para revisar las lecturas.</p></div> : <>
      <div className="rr-toolbar"><label className="rr-search"><Search size={20} /><input aria-label="Buscar por socio, número de medidor o número de lectura" placeholder="Buscar socio, medidor o número de lectura…" maxLength={100} value={search} onChange={e => setSearch(e.target.value)} />{search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}><X size={17} /></button>}</label>{areas.length > 1 && <label className="rr-area">Área<select value={area} onChange={e => { setArea(e.target.value); setParams({area:e.target.value}); setPage(1); setConnection(null); setSelected(null) }}>{areas.map(a => <option key={a.Area} value={a.Area}>{a.Nombre || a.Area}</option>)}</select></label>}</div>
      {connection && <div className="rr-connection"><Gauge size={17} /><span>Conexión #{connection.id} · {connection.socio}</span><button type="button" onClick={() => { setConnection(null); setPage(1) }}>Ver todas <X size={14} /></button></div>}
      <div className="rr-list" aria-busy={loading || searching}><div className="rr-list-heading"><div><h2>Lecturas registradas</h2><p>Ordenadas desde la más reciente. Consumos expresados en {unit}.</p></div><span>Página {page}</span></div>
        {loading || searching ? <div className="rr-empty" role="status"><Loader2 size={28} className="rr-spin" /><p>Buscando lecturas…</p></div> : error ? <div className="rr-empty" role="alert"><Info size={28} /><h3>No se pudieron cargar las lecturas</h3><p>{error}</p><button className="rr-button" onClick={() => setRevision(r => r + 1)}>Reintentar</button></div> : !rows.length ? <div className="rr-empty"><Search size={30} /><h3>{query || connection ? 'No encontramos lecturas para esta consulta' : 'Todavía no hay lecturas registradas'}</h3><p>{query || connection ? 'Probá otro nombre, número de medidor o quitá la conexión seleccionada.' : 'Las mediciones aparecerán aquí cuando el lecturista las registre.'}</p>{page > 1 && <button className="rr-button" onClick={() => setPage(p => p - 1)}>Volver a la página anterior</button>}</div> : <div className="rr-table-scroll"><table><thead><tr><th>Socio / medidor</th><th>Fecha de lectura</th><th>Lectura acumulada</th><th>Consumo</th><th>Revisión</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{rows.map(r => <tr key={r.idMedicion}><td><strong>{r.Socio || 'Socio sin nombre registrado'}</strong><span className="rr-muted"><Gauge size={14} /> Medidor {r.NumeroMedidor ?? 'sin número'} · Lectura #{r.idMedicion}</span></td><td>{day(r.FechaLectura)}</td><td><b>{number(r.ValorLectura)}</b><small className="rr-unit">{unit}</small></td><td>{number(r.ConsumoCalculado)}<small className="rr-unit">{unit}</small></td><td><span className={`rr-status ${r.EstadoRevision === 'Aprobada' ? 'is-approved' : ''}`}>{r.EstadoRevision === 'Aprobada' ? 'Aprobada' : 'Pendiente de revisión'}</span>{!r.TieneFoto&&<small className="rr-missing-photo">Falta foto</small>}</td><td><button type="button" className="rr-open" onClick={() => setSelected(r)}>Revisar <ArrowRight size={16} /></button></td></tr>)}</tbody></table></div>}
        <nav className="rr-pagination" aria-label="Páginas de lecturas"><span>Hasta 25 lecturas por página</span><div><button type="button" disabled={page === 1 || loading || searching} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /> Anterior</button><b>{page}</b><button type="button" disabled={rows.length < 25 || loading || searching || !!error} onClick={() => setPage(p => p + 1)}>Siguiente <ChevronRight size={17} /></button></div></nav>
      </div><p className="rr-footnote"><History size={16} /> Cada corrección conserva el valor anterior, el motivo y el responsable en el historial.</p>
    </>}
    {selected && allowed && <ReadingDialog reading={selected} area={area} unit={unit} onClose={() => setSelected(null)} onSaved={() => setRevision(r => r + 1)} onConnection={() => { setConnection({ id: selected.idServicioSocio, socio: selected.Socio }); setSearch(''); setQuery(''); setPage(1); setSelected(null) }} />}
  </section>
}

function ReadingDialog({ reading, area, unit, onClose, onSaved, onConnection }) {
  const dialog = useRef(null), [current, setCurrent] = useState(reading), [tab, setTab] = useState('summary')
  const [value, setValue] = useState(String(reading.ValorLectura ?? '')), [reason, setReason] = useState(''), [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([]), [historyBusy, setHistoryBusy] = useState(true), [historyError, setHistoryError] = useState(''), [historyPage, setHistoryPage] = useState(1)
  const [motives, setMotives] = useState([]), [motivesBusy, setMotivesBusy] = useState(true), [motivesError, setMotivesError] = useState(''), [reload, setReload] = useState(0)
  const [approvals,setApprovals]=useState([]),[approvalError,setApprovalError]=useState(''),[approvalsBusy,setApprovalsBusy]=useState(true)
  const [photoReady,setPhotoReady]=useState(false),[verified,setVerified]=useState(false)
  const dirty = value !== String(current.ValorLectura ?? '') || !!reason
  const changed = value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) !== Number(current.ValorLectura)
  useEffect(() => { const modal = dialog.current, overflow = document.body.style.overflow; if (!modal.open) modal.showModal(); document.body.style.overflow = 'hidden'; return () => { if (modal.open) modal.close(); document.body.style.overflow = overflow } }, [])
  useEffect(() => {
    const abort = new AbortController(); setHistoryBusy(true); setHistoryError(''); setMotivesBusy(true); setMotivesError('')
    laboralApi(`/lecturas/${reading.idMedicion}/historial`, { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setHistory(data) }).catch(e => { if (!abort.signal.aborted) setHistoryError(e.message) }).finally(() => { if (!abort.signal.aborted) setHistoryBusy(false) })
    laboralApi(`/motivos?area=${encodeURIComponent(area)}`, { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setMotives(data.filter(m => m.Accion === 'CorregirLectura' && m.Activo !== false && m.Activo !== 0)) }).catch(e => { if (!abort.signal.aborted) setMotivesError(e.message) }).finally(() => { if (!abort.signal.aborted) setMotivesBusy(false) })
    setApprovalsBusy(true);setApprovalError('')
    laboralApi(`/lecturas/${reading.idMedicion}/aprobaciones`,{signal:abort.signal}).then(data=>{if(!abort.signal.aborted)setApprovals(data)}).catch(e=>{if(!abort.signal.aborted)setApprovalError(e.message)}).finally(()=>{if(!abort.signal.aborted)setApprovalsBusy(false)})
    return () => abort.abort()
  }, [reading.idMedicion, area, reload])
  async function leave(action = onClose) {
    if (busy) return
    if (dirty && !await confirmAction({ title: '¿Descartar la corrección sin guardar?', message: 'Los valores ingresados todavía no fueron registrados.', confirmButtonText: 'Descartar cambios', cancelButtonText: 'Seguir editando', target: dialog.current })) return
    action()
  }
  async function refreshCurrent(){
    const rows=await laboralApi(`/lecturas?area=${encodeURIComponent(area)}&lectura=${reading.idMedicion}`)
    if(!rows[0])throw new Error('La lectura ya no está disponible. Cerrá el modal y actualizá la consulta.')
    setCurrent(rows[0]);setVerified(false)
  }
  async function approve(){
    if(busy||dirty||!photoReady||!verified||!current.VersionRevision)return
    setBusy(true)
    try{
      if(!await confirmAction({title:'¿Aprobar esta lectura?',message:`Confirmás que la foto coincide con el medidor ${current.NumeroMedidor} y la lectura ${number(current.ValorLectura)} ${unit}. La aprobación quedará registrada con tu usuario y la fecha.`,confirmButtonText:'Aprobar lectura',target:dialog.current}))return
      await laboralApi(`/lecturas/${current.idMedicion}/aprobar`,{method:'POST',body:{VersionRevision:current.VersionRevision}})
      setCurrent(c=>({...c,EstadoRevision:'Aprobada'}));setReload(r=>r+1);onSaved()
      try{await refreshCurrent()}catch(e){await showInfo({title:'La lectura quedó aprobada',message:`No se pudieron actualizar los datos del modal. ${e.message}`,type:'warning',target:dialog.current})}
      showToast({title:'Lectura aprobada',type:'success',target:dialog.current})
    }catch(e){await showInfo({title:'No se pudo aprobar',message:e.message,type:'error',target:dialog.current})}finally{setBusy(false)}
  }
  async function save(event) {
    event.preventDefault(); if (busy || !changed || !reason) return
    setBusy(true)
    try {
      const name = motives.find(m => String(m.idMotivo) === reason)?.Nombre
      if (!await confirmAction({ title: 'Confirmar corrección', message: `Medidor ${current.NumeroMedidor}: ${number(current.ValorLectura)} → ${number(value)} ${unit}. Motivo: ${name}. El sistema recalculará el consumo y, cuando corresponda, el de la lectura siguiente. El cambio quedará en el historial.`, confirmButtonText: 'Guardar corrección', cancelButtonText: 'Volver a revisar', target: dialog.current })) return
      const result = await laboralApi(`/lecturas/${current.idMedicion}/corregir`, { method: 'POST', body: { ValorAnterior: current.ValorLectura, ValorLectura: Number(value), idMotivo: Number(reason) } })
      setCurrent(c => ({ ...c, ...result,EstadoRevision:'Pendiente',VersionRevision:null,FechaAprobacion:null,AprobadaPor:null })); setValue(String(result.ValorLectura)); setReason('');setVerified(false); setHistoryPage(1); setReload(r => r + 1); setTab('history'); onSaved()
      try{await refreshCurrent()}catch(e){await showInfo({title:'La corrección quedó guardada',message:`Actualizá la vista antes de aprobarla. ${e.message}`,type:'warning',target:dialog.current})}
      showToast({ title: 'Corrección registrada', message: 'El consumo se actualizó y el cambio quedó en el historial.', type: 'success', target: dialog.current })
    } catch (e) { await showInfo({ title: 'No se pudo guardar la corrección', message: e.message, type: 'error', target: dialog.current }) }
    finally { setBusy(false) }
  }
  const historyPages = Math.max(1, Math.ceil(history.length / 5)), actualHistoryPage = Math.min(historyPage, historyPages)
  return <dialog ref={dialog} className="rr-dialog" aria-labelledby="rr-dialog-title" onCancel={e => { e.preventDefault(); leave() }}>
    <header className="rr-dialog-header"><span className="rr-dialog-icon"><Gauge size={25} /></span><div><small>LECTURA #{current.idMedicion} · {area === 'AGUA' ? 'AGUA POTABLE' : 'ENERGÍA'}</small><h2 id="rr-dialog-title">Medidor {current.NumeroMedidor ?? 'sin número'}</h2><p>{current.Socio} · {day(current.FechaLectura)}</p></div><button type="button" disabled={busy} aria-label="Cerrar lectura" onClick={() => leave()}><X size={21} /></button></header>
    <div className="rr-tabs" role="tablist" aria-label="Información de la lectura">{[['summary', 'Resumen', ClipboardCheck], ['correct', 'Corregir', PencilLine], ['history', 'Historial', History]].map(([id, title, Icon]) => <button type="button" role="tab" id={`rr-tab-${id}`} aria-controls="rr-panel" aria-selected={tab === id} key={id} onClick={() => setTab(id)} disabled={busy}><Icon size={17} />{title}</button>)}</div>
    <div id="rr-panel" role="tabpanel" aria-labelledby={`rr-tab-${tab}`} className="rr-dialog-body">
      {tab === 'summary' && <><div className="rr-review-status"><span className={`rr-status ${current.EstadoRevision==='Aprobada'?'is-approved':''}`}>{current.EstadoRevision==='Aprobada'?'Lectura aprobada':'Pendiente de revisión'}</span>{current.EstadoRevision==='Aprobada'&&<p>{current.AprobadaPor||'Aprobación registrada'}{current.FechaAprobacion?` · ${moment(current.FechaAprobacion)}`:''}</p>}</div><div className="rr-values"><div><small>Lectura acumulada registrada</small><strong>{number(current.ValorLectura)} <em>{unit}</em></strong></div><div><small>Consumo calculado</small><strong>{number(current.ConsumoCalculado)} <em>{unit}</em></strong></div></div><dl className="rr-details"><div><dt>Socio</dt><dd>{current.Socio || 'Sin nombre registrado'}</dd></div><div><dt>Fecha de lectura</dt><dd>{day(current.FechaLectura)}</dd></div><div><dt>Conexión</dt><dd>#{current.idServicioSocio}</dd></div><div><dt>Período registrado</dt><dd>{current.Periodo || 'No informado'}</dd></div></dl><div className="rr-callout"><Info size={20} /><p>La lectura acumulada es el valor del medidor. El consumo corresponde a la diferencia calculada por el sistema. Si detectás un error, registrá una corrección con su motivo.</p></div><LecturaEvidencia id={current.idMedicion} hasPhoto={current.TieneFoto} onReady={setPhotoReady}/>{current.EstadoRevision!=='Aprobada'&&<label className="rr-verify"><input type="checkbox" disabled={busy||!photoReady||dirty} checked={verified} onChange={e=>setVerified(e.target.checked)}/>Verifiqué que la foto corresponde a este medidor y coincide con la lectura registrada.</label>}{dirty&&<p className="rr-warning">Guardá o descartá la corrección ingresada antes de aprobar.</p>}<div className="rr-summary-actions"><button type="button" className="rr-button" onClick={() => setTab('correct')}><PencilLine size={17} /> Corregir lectura</button><button type="button" className="rr-secondary" onClick={() => leave(onConnection)}>Ver lecturas de esta conexión</button></div></>}
      {tab === 'correct' && <form id="rr-correction-form" onSubmit={save}><h3>Registrá el valor correcto</h3><p className="rr-description">Revisá el número y elegí el motivo que explica el cambio.</p><div className="rr-correction-values"><div><small>Valor registrado</small><strong>{number(current.ValorLectura)} <em>{unit}</em></strong></div><ArrowRight size={21} /><label>Nuevo valor acumulado <span>({unit})</span><input autoFocus type="number" min="0" step="0.01" required value={value} disabled={busy} onChange={e => setValue(e.target.value)} /></label></div>{value.trim() !== '' && Number(value) === Number(current.ValorLectura) && <p className="rr-description">Ingresá un valor diferente para registrar una corrección.</p>}<label className="rr-field">Motivo de la corrección<select required disabled={busy || motivesBusy || !!motivesError || !motives.length} value={reason} onChange={e => setReason(e.target.value)}><option value="">{motivesBusy ? 'Cargando motivos…' : 'Seleccioná el motivo del cambio'}</option>{motives.map(m => <option key={m.idMotivo} value={m.idMotivo}>{m.Nombre}</option>)}</select></label>{motivesError ? <div className="rr-warning" role="alert"><p>No se pudieron cargar los motivos: {motivesError}</p><button type="button" onClick={() => setReload(r => r + 1)}>Reintentar</button></div> : !motivesBusy && !motives.length && <p className="rr-warning">No hay motivos activos de corrección para esta área. El administrador debe configurarlos antes de continuar.</p>}<div className="rr-callout"><History size={20} /><p>Al guardar se recalcula el consumo y se conserva el valor anterior, la fecha, tu usuario y el motivo. El sistema verifica las lecturas anterior, siguiente y de retiro antes de aceptar el cambio.</p></div></form>}
      {tab === 'history' && <><section className="rr-approval-history"><h3>Aprobaciones</h3>{approvalsBusy?<p className="rr-description">Cargando aprobaciones…</p>:approvalError?<div className="rr-warning" role="alert">{approvalError}<button type="button" onClick={()=>setReload(r=>r+1)}>Reintentar</button></div>:!approvals.length?<p className="rr-description">Todavía no hay aprobaciones registradas.</p>:<ol>{approvals.map(a=><li key={a.idAprobacion}><CheckCircle2 size={17}/><div><strong>{a.Responsable}</strong><p>{moment(a.FechaUtc)} · Lectura {number(a.ValorLectura)} {unit}</p><span className={`rr-status ${a.Vigente?'is-approved':''}`}>{a.Vigente?'Aprobación vigente':'Aprobación anterior · la lectura o sus datos cambiaron'}</span></div></li>)}</ol>}</section><div className="rr-history-title"><div><h3>Historial de correcciones</h3><p className="rr-description">Cambios reales sobre esta lectura, del más reciente al más antiguo.</p></div>{!historyBusy && !historyError && <span>{history.length}</span>}</div>{historyBusy ? <div className="rr-empty" role="status"><Loader2 className="rr-spin" size={25} /><p>Cargando historial…</p></div> : historyError ? <div className="rr-warning" role="alert"><p>No se pudo consultar el historial: {historyError}</p><button onClick={() => setReload(r => r + 1)}>Reintentar</button></div> : !history.length ? <div className="rr-empty"><CheckCircle2 size={30} /><h3>Sin correcciones registradas</h3><p>Esta lectura todavía no tiene cambios en su historial.</p></div> : <><ol className="rr-timeline">{history.slice((actualHistoryPage - 1) * 5, actualHistoryPage * 5).map(h => { const before = snapshot(h.Anterior), after = snapshot(h.Nuevo); return <li key={h.idCorreccion}><span className="rr-event-icon"><PencilLine size={15} /></span><div><time>{moment(h.FechaUtc)}</time><h4>{h.Motivo}</h4><p className="rr-history-actor">Registrado por <strong>{h.Responsable || 'Responsable no registrado'}</strong></p><div className="rr-change"><span>{number(before?.ValorLectura)}</span><ArrowRight size={15} /><strong>{number(after?.ValorLectura)} {unit}</strong></div>{before?.ConsumoCalculado != null && after?.ConsumoCalculado != null && <p className="rr-description">Consumo: {number(before.ConsumoCalculado)} → {number(after.ConsumoCalculado)} {unit}</p>}{before?.Siguiente && after?.Siguiente && before.Siguiente.ConsumoCalculado !== after.Siguiente.ConsumoCalculado && <p className="rr-description">Consumo de lectura siguiente #{after.Siguiente.idMedicion}: {number(before.Siguiente.ConsumoCalculado)} → {number(after.Siguiente.ConsumoCalculado)} {unit}</p>}</div></li> })}</ol>{historyPages > 1 && <nav className="rr-pagination" aria-label="Páginas del historial"><button disabled={actualHistoryPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Anterior</button><span>{actualHistoryPage} / {historyPages}</span><button disabled={actualHistoryPage === historyPages} onClick={() => setHistoryPage(p => p + 1)}>Siguiente</button></nav>}</>}</>}
    </div><footer className="rr-dialog-footer"><button type="button" className="rr-secondary" disabled={busy} onClick={() => leave()}>Cerrar</button>{tab==='summary'&&current.EstadoRevision!=='Aprobada'&&<button type="button" className="rr-button" disabled={busy||dirty||!photoReady||!verified||!current.VersionRevision} onClick={approve}>{busy?<Loader2 size={17} className="rr-spin"/>:<CheckCircle2 size={17}/>}Aprobar lectura</button>}{tab === 'correct' && <button type="submit" form="rr-correction-form" className="rr-button" disabled={busy || !changed || !reason || motivesBusy || !!motivesError}>{busy ? <><Loader2 size={17} className="rr-spin" /> Guardando…</> : <><CheckCircle2 size={17} /> Guardar corrección</>}</button>}</footer>
  </dialog>
}
