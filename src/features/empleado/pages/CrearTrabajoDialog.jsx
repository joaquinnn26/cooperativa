import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Building2, Check, ClipboardList, Loader2, MapPin, Search, UserRound, X } from 'lucide-react'
import { laboralApi } from '@/utils/laboral.js'
import { uniqueActiveConnections, workTaskPayload } from '@/utils/laboralCreateWork.js'
import './CrearTrabajoDialog.css'

export default function CrearTrabajoDialog({ area, areaName, busy, error, onCreate, onClose }) {
  const dialog = useRef(null)
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState('internal')
  const [search, setSearch] = useState('')
  const [connections, setConnections] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [validation, setValidation] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => { dialog.current.showModal() }, [])
  useEffect(() => {
    if (mode !== 'connection') return
    const abort = new AbortController()
    setLoading(true); setSearchError(''); setConnections([])
    const timer = setTimeout(async () => {
      try {
        const items = await laboralApi(`/conexiones?area=${encodeURIComponent(area)}&q=${encodeURIComponent(search.trim())}`, { signal: abort.signal })
        if (!abort.signal.aborted) setConnections(uniqueActiveConnections(items))
      } catch (failure) { if (!abort.signal.aborted) setSearchError(failure.message) }
      finally { if (!abort.signal.aborted) setLoading(false) }
    }, 300)
    return () => { clearTimeout(timer); abort.abort() }
  }, [area, mode, search, retry])
  const ready = title.trim().length >= 5 && (mode === 'internal' || Boolean(selected))
  function submit(event) {
    event.preventDefault(); setValidation('')
    try { onCreate(workTaskPayload(area, title, mode, selected)) }
    catch (failure) { setValidation(failure.message) }
  }
  return <dialog ref={dialog} className="create-work-dialog" aria-labelledby="create-work-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <form onSubmit={submit}>
      <header className="create-work-hero"><div className="create-work-hero-icon"><ClipboardList size={27}/></div><div><span>ORGANIZAR EL TRABAJO · {areaName}</span><h2 id="create-work-title">Crear trabajo</h2><p>Definí qué necesita hacerse y dónde.</p></div><button type="button" aria-label="Cerrar formulario" disabled={busy} onClick={onClose}><X size={21}/></button></header>
      <div className="create-work-body">
        {(error || validation) && <p role="alert" className="create-work-error">{validation || error}</p>}
        <fieldset disabled={busy} className="create-work-fields">
          <section><div className="create-work-section-title"><span>1</span><div><h3>¿Qué hay que hacer?</h3><p>Escribí una indicación concreta para el equipo.</p></div></div><label className="create-work-label" htmlFor="create-work-description">Descripción del trabajo</label><textarea autoFocus id="create-work-description" required minLength={5} maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ej.: Revisar el medidor y verificar la conexión del domicilio."/><div className="create-work-counter"><span>Incluí el objetivo y las referencias necesarias.</span><span>{title.length}/200</span></div></section>
          <section><div className="create-work-section-title"><span>2</span><div><h3>¿Dónde se realiza?</h3><p>Elegí si corresponde a una conexión de un socio.</p></div></div><div className="create-work-modes" role="group" aria-label="Destino del trabajo">
            <button type="button" aria-pressed={mode === 'internal'} className={mode === 'internal' ? 'is-selected' : ''} onClick={() => { setMode('internal'); setSelected(null); setValidation('') }}><Building2 size={22}/><strong>Trabajo interno</strong><small>Mantenimiento o tareas generales del área.</small>{mode === 'internal' && <Check className="create-work-mode-check" size={16}/>}</button>
            <button type="button" aria-pressed={mode === 'connection'} className={mode === 'connection' ? 'is-selected' : ''} onClick={() => { setMode('connection'); setValidation('') }}><MapPin size={22}/><strong>Conexión de un socio</strong><small>Intervención en un servicio y domicilio.</small>{mode === 'connection' && <Check className="create-work-mode-check" size={16}/>}</button>
          </div>
          {mode === 'connection' && <div className="create-work-connection-picker"><label className="create-work-search"><Search size={18}/><input aria-label="Buscar conexión por socio o domicilio" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por socio, domicilio o medidor…"/></label>
            {selected && <div className="create-work-selected" role="status"><Check size={18}/><div><strong>{selected.Socio}</strong><span>{selected.Servicio} · {selected.Direccion || 'Sin domicilio registrado'}</span></div><button type="button" aria-label="Quitar conexión seleccionada" onClick={() => setSelected(null)}><X size={16}/></button></div>}
            {loading ? <p className="create-work-empty" role="status"><Loader2 className="create-work-spin" size={18}/>Buscando conexiones del área…</p> : searchError ? <div className="create-work-error" role="alert"><p>{searchError}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar búsqueda</button></div> : <div className="create-work-results" role="radiogroup" aria-label="Conexiones disponibles">{connections.map(connection => <label key={connection.idServicioSocio} className={`create-work-connection ${String(selected?.idServicioSocio) === String(connection.idServicioSocio) ? 'is-selected' : ''}`}><input type="radio" name="work-connection" checked={String(selected?.idServicioSocio) === String(connection.idServicioSocio)} onChange={() => setSelected(connection)}/><UserRound size={18}/><span><strong>{connection.Socio}</strong><span>{connection.Servicio} · {connection.Direccion || 'Sin domicilio registrado'}</span><small>Conexión #{connection.idServicioSocio}{connection.NumeroMedidor && ` · Medidor ${connection.NumeroMedidor}`}{connection.Ruta && ` · Ruta ${connection.Ruta}`}{connection.Folio && ` / Folio ${connection.Folio}`}</small></span></label>)}{!connections.length && <p className="create-work-empty">No hay conexiones activas para esta búsqueda. Probá otro nombre o domicilio.</p>}</div>}
            <p className="create-work-hint">Se muestran hasta 25 resultados. Afiná la búsqueda para localizar la conexión.</p>
          </div>}</section>
        </fieldset>
        <aside className="create-work-summary"><ClipboardList size={20}/><div><strong>{title.trim() || 'Tu nuevo trabajo'}</strong><p>{areaName} · {mode === 'internal' ? 'Trabajo interno' : selected ? `${selected.Socio} · ${selected.Servicio}` : 'Falta seleccionar una conexión'}</p><small>Se creará pendiente de asignación. Después podrás elegir al responsable desde la tarea.</small></div></aside>
      </div>
      <footer className="create-work-footer"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy || !ready}>{busy ? <><Loader2 className="create-work-spin" size={17}/>Creando…</> : <>Crear trabajo<ArrowRight size={17}/></>}</button></footer>
    </form>
  </dialog>
}
