import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, MapPin, MapPinned, Search, X } from 'lucide-react'
import { apiLaboralExistente, laboralApi } from '@/utils/laboral.js'
import { confirmAction, showInfo } from '@/utils/alerts.js'
import { localRouteDate, routeDateLabel, routeText } from './recorridosUtils.js'

export default function CrearRecorridoDialog({ area, areaName, team, routes, onClose, onCreated }) {
  const dialog = useRef(null), heading = useRef(null)
  const [step, setStep] = useState(0), [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ Nombre: '', Fecha: localRouteDate(), IdEmpleado: '' })
  const [query, setQuery] = useState(''), [page, setPage] = useState(1), [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0)
  const [selection, setSelection] = useState([]), [selectedOnly, setSelectedOnly] = useState(false), [reviewPage, setReviewPage] = useState(1)
  const steps = ['Datos y responsable', 'Elegir medidores', 'Revisar y asignar']
  const employee = team.find(item => String(item.idEmpleado) === String(form.IdEmpleado))
  useEffect(() => {
    const modal = dialog.current, previous = document.body.style.overflow
    if (!modal.open) modal.showModal()
    document.body.style.overflow = 'hidden'
    return () => { if (modal.open) modal.close(); document.body.style.overflow = previous }
  }, [])
  useEffect(() => {
    if (step !== 1 || selectedOnly) return
    const abort = new AbortController(); setLoading(true); setError(''); setConnections([])
    const timer = setTimeout(() => laboralApi(`/conexiones?area=${area}&q=${encodeURIComponent(query.trim())}&pagina=${page}`, { signal: abort.signal })
      .then(items => { if (!abort.signal.aborted) setConnections(items) })
      .catch(failure => { if (!abort.signal.aborted) setError(failure.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) }), 250)
    return () => { clearTimeout(timer); abort.abort() }
  }, [area, step, selectedOnly, query, page, retry])
  const reserved = useMemo(() => new Set(routes.filter(route => route.estado !== 'Cancelada' && String(route.fecha).slice(0, 7) === form.Fecha.slice(0, 7)).flatMap(route => (route.items || []).map(item => Number(item.idMedidor)))), [routes, form.Fecha])
  const selectedIds = new Set(selection.map(item => Number(item.idMedidor)))
  const available = item => Boolean(item.Activo && item.idMedidor && !reserved.has(Number(item.idMedidor)))
  const selectedMatches = selection.filter(item => routeText([item.Socio, item.Direccion, item.NumeroMedidor, item.Ruta, item.Folio].join(' ')).includes(routeText(query.trim())))
  const selectionPages = Math.max(1, Math.ceil(selectedMatches.length / 25)), selectedPage = Math.min(page, selectionPages)
  const shown = selectedOnly ? selectedMatches.slice((selectedPage - 1) * 25, selectedPage * 25) : connections
  const reviewPages = Math.max(1, Math.ceil(selection.length / 10)), actualReview = Math.min(reviewPage, reviewPages)
  const selectionError = !selection.length ? 'Elegí al menos un medidor para continuar.' : selection.some(item => !available(item)) ? 'Hay equipos seleccionados con otro recorrido en el mes elegido. Quitalos antes de continuar.' : ''
  function go(next) { setStep(next); requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); dialog.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }) }
  async function close() {
    if (busy) return
    if ((selection.length || form.Nombre.trim() || form.IdEmpleado) && !await confirmAction({ title: '¿Salir del armado del recorrido?', message: 'Los datos que todavía no guardaste se descartarán.', confirmButtonText: 'Salir', cancelButtonText: 'Seguir armando', target: dialog.current })) return
    onClose()
  }
  function toggle(item) {
    const id = Number(item.idMedidor)
    if (selectedIds.has(id)) { setSelection(current => current.filter(value => Number(value.idMedidor) !== id)); return }
    if (!available(item)) return
    if (selection.length >= 300) { showInfo({ title: 'Límite por recorrido', message: 'Podés incluir hasta 300 medidores por hoja.', type: 'warning', target: dialog.current }); return }
    setSelection(current => current.some(value => Number(value.idMedidor) === id) ? current : [...current, item])
  }
  function addPage() {
    const additions = [...new Map(shown.filter(item => available(item) && !selectedIds.has(Number(item.idMedidor))).map(item => [Number(item.idMedidor), item])).values()]
    if (selection.length + additions.length > 300) { showInfo({ title: 'Límite por recorrido', message: 'La selección superaría los 300 medidores. Agregá menos equipos o armá otra hoja.', type: 'warning', target: dialog.current }); return }
    setSelection(current => [...current, ...additions])
  }
  function move(index, direction) { setSelection(current => { const copy = [...current], next = index + direction; if (next < 0 || next >= copy.length) return current; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy }) }
  async function next() {
    const issue = step === 0 ? !form.Nombre.trim() ? 'Poné un nombre que identifique el recorrido.' : !form.Fecha || form.Fecha < localRouteDate() ? 'Elegí hoy o una fecha posterior.' : !employee ? 'Seleccioná un lecturista del área.' : '' : selectionError
    if (issue) { await showInfo({ title: 'Falta completar este paso', message: issue, type: 'warning', target: dialog.current }); return }
    go(step + 1)
  }
  async function submit(event) {
    event.preventDefault(); if (busy || step !== 2) return
    if (selectionError || !employee || !form.Nombre.trim() || !form.Fecha || form.Fecha < localRouteDate()) { await showInfo({ title: 'Revisá el recorrido', message: selectionError || 'Completá el nombre, una fecha vigente y el lecturista antes de asignar.', type: 'warning', target: dialog.current }); return }
    setBusy(true)
    try {
      if (!await confirmAction({ title: 'Crear y asignar recorrido', message: `${employee.Nombre} recibirá «${form.Nombre.trim()}» para el ${routeDateLabel(form.Fecha)}, con ${selection.length} medidores en el orden elegido.`, confirmButtonText: 'Crear y asignar', cancelButtonText: 'Seguir revisando', target: dialog.current })) return
      const created = await apiLaboralExistente('/rutas-medicion', { method: 'POST', body: { Nombre: form.Nombre.trim(), Fecha: form.Fecha, IdEmpleado: Number(form.IdEmpleado), Medidores: selection.map(item => Number(item.idMedidor)) } })
      await showInfo({ title: 'Recorrido asignado', message: 'La hoja ya está disponible para el lecturista. Podés consultar su detalle y avance.', type: 'success', target: dialog.current })
      onCreated(created)
    } catch (failure) { await showInfo({ title: 'No se pudo crear el recorrido', message: failure.message, type: 'error', target: dialog.current }) }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="routes-dialog routes-create" aria-labelledby="route-create-title" onCancel={event => { event.preventDefault(); close() }}><form onSubmit={submit}>
    <header className="routes-dialog-header"><span><MapPinned size={27}/></span><div><small>{areaName} · NUEVA HOJA DE RUTA</small><h2 id="route-create-title">Armar recorrido</h2><p>Completá un paso por vez. La selección se conserva al volver atrás.</p></div><button type="button" disabled={busy} aria-label="Cerrar formulario" onClick={close}><X size={21}/></button></header>
    <ol className="routes-steps">{steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={step === index ? 'is-active' : step > index ? 'is-done' : ''}><span>{step > index ? <Check size={14}/> : index + 1}</span>{label}</li>)}</ol>
    <div key={step} className="routes-dialog-body"><h3 ref={heading} tabIndex={-1}>{steps[step]}</h3>
      {step === 0 && <fieldset disabled={busy} className="routes-data-fields"><label>Nombre del recorrido<input autoFocus required maxLength={120} value={form.Nombre} onChange={event => setForm(current => ({...current, Nombre:event.target.value}))} placeholder="Ej.: Zona centro · Ruta 3"/><small>Usá un nombre fácil de reconocer para el lecturista.</small></label><div><label>Fecha de trabajo<input required type="date" min={localRouteDate()} value={form.Fecha} onChange={event => setForm(current => ({...current, Fecha:event.target.value}))}/></label><label>Lecturista responsable<select required value={form.IdEmpleado} onChange={event => setForm(current => ({...current, IdEmpleado:event.target.value}))}><option value="">Elegí un lecturista</option>{team.map(person => <option key={person.idEmpleado} value={person.idEmpleado}>{person.Nombre}</option>)}</select></label></div>{!team.length && <p className="routes-callout">No hay lecturistas con asignación vigente en esta área. Configurá su puesto antes de crear el recorrido.</p>}<p className="routes-callout">La API comprueba que los medidores no tengan otra hoja ni una lectura registrada en el mes del recorrido.</p></fieldset>}
      {step === 1 && <><div className="routes-selection-banner"><strong>{selection.length} / 300 medidores elegidos</strong><label><input type="checkbox" checked={selectedOnly} onChange={event => { setSelectedOnly(event.target.checked); setPage(1) }}/>Ver solo elegidos</label></div><label className="routes-search"><Search size={18}/><input aria-label="Buscar conexiones para el recorrido" maxLength={100} value={query} placeholder="Socio, domicilio, número de medidor, ruta o folio…" onChange={event => { setQuery(event.target.value); setPage(1) }}/>{query && <button type="button" aria-label="Limpiar búsqueda de conexiones" onClick={() => { setQuery(''); setPage(1) }}><X size={16}/></button>}</label><div className="routes-selection-tools"><p>Agregá equipos de distintas páginas sin perder la selección.</p><button type="button" disabled={(!selectedOnly && loading) || !shown.some(item => available(item) && !selectedIds.has(Number(item.idMedidor)))} onClick={addPage}>Agregar disponibles de esta página</button></div>
        {!selectedOnly && loading ? <div className="routes-empty" role="status"><Loader2 className="routes-spin" size={23}/>Buscando conexiones…</div> : !selectedOnly && error ? <div className="routes-empty" role="alert"><p>{error}</p><button type="button" className="btn-secondary" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div> : <div className="routes-connection-list">{shown.map(item => { const selected = selectedIds.has(Number(item.idMedidor)), eligible = available(item); return <label key={`${item.idServicioSocio}:${item.idMedidor || 'none'}`} className={`${selected ? 'is-selected' : ''} ${!eligible && !selected ? 'is-disabled' : ''}`}><input type="checkbox" checked={selected} disabled={!eligible && !selected} onChange={() => toggle(item)}/><span><strong>{item.Socio}</strong><p><MapPin size={13}/>{item.Direccion || 'Domicilio no registrado'}</p><small>Medidor {item.NumeroMedidor || 'sin instalar'} · Ruta {item.Ruta || 'sin informar'} / Folio {item.Folio || 'sin informar'}</small>{!eligible && <em>{!item.Activo ? 'Conexión inactiva' : !item.idMedidor ? 'Falta instalar medidor' : 'Ya tiene recorrido en este mes'}</em>}</span>{selected && <b>#{selection.findIndex(value => Number(value.idMedidor) === Number(item.idMedidor)) + 1}</b>}</label> })}{!shown.length && <div className="routes-empty"><p>{selectedOnly ? 'No hay equipos elegidos que coincidan con la búsqueda.' : 'No hay conexiones en esta página para la búsqueda.'}</p></div>}</div>}
        <nav className="routes-pagination" aria-label="Páginas de conexiones"><span>{selectedOnly ? `${selectedMatches.length} elegidos para esta búsqueda` : `${connections.length} conexiones en esta página`}</span><div><button type="button" aria-label="Página anterior de conexiones" disabled={(!selectedOnly && loading) || (selectedOnly ? selectedPage : page) <= 1} onClick={() => setPage((selectedOnly ? selectedPage : page) - 1)}><ChevronLeft size={17}/></button><span>Página {selectedOnly ? `${selectedPage} de ${selectionPages}` : page}</span><button type="button" aria-label="Página siguiente de conexiones" disabled={selectedOnly ? selectedPage >= selectionPages : loading || Boolean(error) || connections.length < 25} onClick={() => setPage((selectedOnly ? selectedPage : page) + 1)}><ChevronRight size={17}/></button></div></nav>{selectionError && selection.length > 0 && <p className="routes-callout">{selectionError}</p>}</>}
      {step === 2 && <><div className="routes-review-summary"><ClipboardCheck size={25}/><div><strong>{form.Nombre}</strong><p>{employee?.Nombre} · {routeDateLabel(form.Fecha)}</p><small>{selection.length} medidores · {areaName}</small></div></div><p className="routes-note">El lecturista verá los medidores en este orden. Usá las flechas para acomodar las visitas.</p><ol className="routes-order-list">{selection.slice((actualReview - 1) * 10, actualReview * 10).map((item, offset) => { const index = (actualReview - 1) * 10 + offset; return <li key={item.idMedidor}><b>{index + 1}</b><div><strong>{item.Socio}</strong><p>{item.Direccion || 'Domicilio no registrado'} · Medidor {item.NumeroMedidor}</p><small>Ruta {item.Ruta || 'sin informar'} / Folio {item.Folio || 'sin informar'}</small></div><div className="routes-order-buttons"><button type="button" disabled={busy || index === 0} aria-label={`Subir medidor ${item.NumeroMedidor}`} onClick={() => move(index, -1)}><ArrowUp size={16}/></button><button type="button" disabled={busy || index === selection.length - 1} aria-label={`Bajar medidor ${item.NumeroMedidor}`} onClick={() => move(index, 1)}><ArrowDown size={16}/></button><button type="button" disabled={busy} aria-label={`Quitar medidor ${item.NumeroMedidor}`} onClick={() => toggle(item)}><X size={16}/></button></div></li> })}</ol><nav className="routes-pagination" aria-label="Páginas de equipos elegidos"><span>Orden de visitas</span><div><button type="button" disabled={busy || actualReview === 1} aria-label="Página anterior de selección" onClick={() => setReviewPage(actualReview - 1)}><ChevronLeft size={17}/></button><span>{actualReview} / {reviewPages}</span><button type="button" disabled={busy || actualReview === reviewPages} aria-label="Página siguiente de selección" onClick={() => setReviewPage(actualReview + 1)}><ChevronRight size={17}/></button></div></nav>{selectionError && <p className="routes-callout">{selectionError}</p>}</>}
    </div><footer className="routes-dialog-footer"><button type="button" className="btn-secondary" disabled={busy} onClick={step ? () => go(step - 1) : close}>{step ? <><ArrowLeft size={16}/>Anterior</> : 'Cancelar'}</button><span>Paso {step + 1} de 3</span>{step < 2 ? <button type="button" className="btn-primary" disabled={busy} onClick={next}>Continuar<ArrowRight size={16}/></button> : <button className="btn-primary" disabled={busy || Boolean(selectionError)}>{busy ? <><Loader2 size={16} className="routes-spin"/>Guardando…</> : 'Crear y asignar'}</button>}</footer>
  </form></dialog>
}
