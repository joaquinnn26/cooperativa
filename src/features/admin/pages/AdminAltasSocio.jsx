import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, Users, Clock3, CheckCircle2, FileText, X, ChevronLeft, ChevronRight, ArrowUpRight, Loader2, Download, AlertCircle } from 'lucide-react'
import { altaSocioApi, descargarDocumentoAlta } from '@/utils/altaSocioApi.js'
import { apiUrl } from '@/config/api.js'
import { estadosAlta, requisitosAlta } from '@/utils/altaSocio.js'
import './AdminAltasSocio.css'

const normalizar = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const fecha = value => value ? new Date(value).toLocaleDateString('es-AR') : 'Sin envío'
const esTitular = value => value === true || value === 1 || value === 'true' || value === 'True'
function Estado({ value }) { return <span className={`aa-status aa-status-${value}`}>{estadosAlta[value] || value}</span> }

function Documento({ documento, onError }) {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const abort = new AbortController()
    let url
    setPreview(null); setError('')
    async function load() {
      try {
        const response = await fetch(apiUrl(`/alta-socio/documentos/${documento.idDocumento}`), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: abort.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('No se pudo abrir la vista previa.')
        const blob = await response.blob()
        if (abort.signal.aborted) return
        url = URL.createObjectURL(blob); setPreview({ url, mime: blob.type })
      } catch (e) { if (!abort.signal.aborted) setError(e.message) }
    }
    load()
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url) }
  }, [documento.idDocumento])
  return <>
    {error ? <p className="aa-error">{error}</p> : !preview ? <div className="aa-preview-loading"><Loader2 className="aa-spin" />Cargando vista previa…</div> : <>
      {preview.mime.startsWith('image/') ? <img className="aa-preview" src={preview.url} alt={`Vista previa de ${documento.Nombre}`} /> : <iframe className="aa-preview" src={preview.url} title={`Vista previa de ${documento.Nombre}`} />}
      <a className="aa-text-button" href={preview.url} target="_blank" rel="noreferrer">Ampliar documento <ArrowUpRight size={14} /></a>
    </>}
    <p className="aa-file-name" title={documento.Nombre}>{documento.Nombre}</p>
    <button className="aa-text-button" onClick={async () => { try { await descargarDocumentoAlta(documento) } catch (e) { onError(e.message) } }}><Download size={14} />Descargar</button>
  </>
}

export default function AdminAltasSocio() {
  const [rows, setRows] = useState([]), [reasons, setReasons] = useState([])
  const [selected, setSelected] = useState(null), [detail, setDetail] = useState(null), [reason, setReason] = useState('')
  const [error, setError] = useState(''), [modalError, setModalError] = useState(''), [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0)
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [titular, setTitular] = useState(''), [sort, setSort] = useState('prioridad')
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(8)
  const dialog = useRef(null)
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('')
    Promise.all([altaSocioApi('', { signal: abort.signal }), altaSocioApi('/motivos', { signal: abort.signal })]).then(([a, m]) => {
      if (!abort.signal.aborted) { setRows(a); setReasons(m) }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [revision])
  useEffect(() => {
    if (!selected) return
    const abort = new AbortController()
    setDetail(null); setModalError(''); setReason('')
    dialog.current.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    altaSocioApi(`/${selected.idUsuarioSistema}`, { signal: abort.signal }).then(d => { if (!abort.signal.aborted) setDetail(d) }).catch(e => { if (!abort.signal.aborted) setModalError(e.message) })
    return () => { abort.abort(); document.body.style.overflow = previous }
  }, [selected])
  useEffect(() => { setPage(1) }, [query, status, titular, sort, pageSize])
  const filtered = useMemo(() => {
    const terms = normalizar(query).split(/\s+/).filter(Boolean)
    return rows.filter(r => (!status || r.Estado === status) && (!titular || esTitular(r.EsTitular) === (titular === 'si')) && terms.every(term => normalizar(`${r.Nombre} ${r.Apellido} ${r.Documento} ${r.Email}`).includes(term))).sort((a, b) => {
      if (sort === 'nombre') return `${a.Apellido} ${a.Nombre}`.localeCompare(`${b.Apellido} ${b.Nombre}`, 'es')
      if (sort === 'prioridad') { const rank = { EnRevision: 0, Rechazada: 1, PendienteDocumentacion: 2, Aprobada: 3 }; const diff = (rank[a.Estado] ?? 4) - (rank[b.Estado] ?? 4); if (diff) return diff }
      return (Date.parse(b.FechaEnvioUtc) || 0) - (Date.parse(a.FechaEnvioUtc) || 0) || b.idUsuarioSistema - a.idUsuarioSistema
    })
  }, [rows, query, status, titular, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const clear = () => { setQuery(''); setStatus(''); setTitular(''); setPage(1) }
  function close() { if (!busy) { if (dialog.current?.open) dialog.current.close(); else { setSelected(null); setDetail(null); setModalError('') } } }
  async function decide(approve) {
    if (busy || !detail) return
    setBusy(true); setModalError('')
    try {
      await altaSocioApi(`/${selected.idUsuarioSistema}/decision`, { method: 'POST', body: JSON.stringify({ Aprobar: approve, Motivo: approve ? null : reason, Version: detail.tramite.Version }) })
      setMessage(`${selected.Nombre} ${selected.Apellido}: ${approve ? 'alta aprobada' : 'alta rechazada'}.`)
      dialog.current?.close(); setRevision(v => v + 1)
    } catch (e) { setModalError(e.message) } finally { setBusy(false) }
  }
  return <div className="aa-page">
    <header className="aa-header"><div><span className="aa-eyebrow">ADMINISTRACIÓN · SOCIOS</span><h1>Altas de socios</h1><p>Cada nueva cuenta, un paso más cerca. Revisá y gestioná las solicitudes desde acá.</p></div><span className="aa-header-icon"><Users size={30} /></span></header>
    <div className="aa-stats">
      {[['', 'Solicitudes', Users], ['EnRevision', 'Para revisar', Clock3], ['Aprobada', 'Aprobadas', CheckCircle2], ['PendienteDocumentacion', 'Esperando documentos', FileText]].map(([key, label, Icon]) => <button className={`aa-stat ${status === key ? 'is-active' : ''}`} key={label} onClick={() => { setStatus(key); setPage(1) }} aria-pressed={status === key}><span className="aa-stat-icon"><Icon size={21} /></span><span><strong>{loading ? '—' : key ? rows.filter(r => r.Estado === key).length : rows.length}</strong><small>{label}</small></span></button>)}
    </div>
    {error && <p role="alert" className="aa-error">{error} <button onClick={() => setRevision(v => v + 1)}>Reintentar</button></p>}
    {message && <p role="status" className="aa-success"><CheckCircle2 size={18} />{message}<button aria-label="Cerrar aviso" onClick={() => setMessage('')}><X size={16} /></button></p>}
    <section className="aa-list">
      <div className="aa-filters"><label className="aa-search"><Search size={18} /><input aria-label="Buscar por nombre, apellido, DNI o correo" placeholder="Buscar por nombre, DNI o correo…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Borrar búsqueda" onClick={() => setQuery('')}><X size={16} /></button>}</label><div className="aa-filter-fields"><SlidersHorizontal size={18} aria-hidden="true" /><label>Estado<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{Object.entries(estadosAlta).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Domicilio<select value={titular} onChange={e => setTitular(e.target.value)}><option value="">Todos</option><option value="si">Titular</option><option value="no">No titular</option></select></label><label>Ordenar por<select value={sort} onChange={e => setSort(e.target.value)}><option value="prioridad">Prioridad de revisión</option><option value="reciente">Envíos más recientes</option><option value="nombre">Apellido: A a Z</option></select></label></div></div>
      <div className="aa-results"><span aria-live="polite">{filtered.length} solicitudes encontradas</span>{(query || status || titular) && <button className="aa-text-button" onClick={clear}><X size={13} />Limpiar filtros</button>}</div>
      {loading ? <div className="aa-empty" role="status"><Loader2 className="aa-spin" /><h2>Cargando solicitudes…</h2></div> : !visible.length ? <div className="aa-empty"><Search size={32} /><h2>{rows.length ? 'No encontramos coincidencias' : 'Todavía no hay solicitudes'}</h2><p>{rows.length ? 'Probá con otro nombre o ajustá los filtros.' : 'Las nuevas altas aparecerán en esta lista.'}</p>{rows.length > 0 && <button className="aa-button" onClick={clear}>Ver todas las solicitudes</button>}</div> : <div className="aa-table-scroll"><table><thead><tr><th>Solicitante</th><th>DNI</th><th>Estado</th><th>Enviado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{visible.map(r => <tr key={r.idUsuarioSistema}><td><div className="aa-person"><span className="aa-avatar">{r.Nombre?.[0]}{r.Apellido?.[0]}</span><div><strong>{r.Nombre} {r.Apellido}</strong><span>{r.Email}</span></div></div></td><td>{r.Documento}</td><td><Estado value={r.Estado} /></td><td>{fecha(r.FechaEnvioUtc)}</td><td><button className="aa-review" aria-label={`Revisar documentación de ${r.Nombre} ${r.Apellido}`} onClick={() => setSelected(r)}>Revisar <ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div>}
      <footer className="aa-pagination"><label>Por página <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{[8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}</select></label><span>{filtered.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} de ${filtered.length}` : '0 resultados'}</span><nav aria-label="Paginación de solicitudes"><button aria-label="Página anterior" disabled={currentPage === 1 || loading} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button><span>Página {currentPage} de {pages}</span><button aria-label="Página siguiente" disabled={currentPage === pages || loading} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button></nav></footer>
    </section>
    {selected && <dialog ref={dialog} className="aa-modal" aria-labelledby="aa-modal-title" onClose={() => { setSelected(null); setDetail(null); setModalError('') }} onCancel={e => { e.preventDefault(); close() }} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <header className="aa-modal-header"><div><span className="aa-eyebrow">REVISIÓN DE DOCUMENTACIÓN</span><h2 id="aa-modal-title">{selected.Nombre} {selected.Apellido}</h2></div><button className="aa-icon-button" autoFocus disabled={busy} aria-label="Cerrar revisión" onClick={close}><X size={22} /></button></header>
      <div className="aa-modal-body"><div className="aa-person-details"><span><strong>DNI</strong>{selected.Documento}</span><span><strong>Correo</strong>{selected.Email}</span><span><strong>Domicilio</strong>{selected.Calle} {selected.Numero}</span><span><strong>Titular</strong>{selected.EsTitular ? 'Sí' : 'No'}</span></div>
        {modalError && <p role="alert" className="aa-error"><AlertCircle size={17} />{modalError}</p>}
        {!detail ? <div className="aa-empty">{modalError ? <p>Cerrá la revisión y volvé a abrirla para reintentar.</p> : <><Loader2 className="aa-spin" /><p>Cargando documentación…</p></>}</div> : <><div className="aa-docs-title"><h3>Documentos presentados</h3><Estado value={detail.tramite.Estado} /></div>{detail.tramite.Motivo && <p className="aa-warning">Observación anterior: {detail.tramite.Motivo}</p>}<div className="aa-doc-grid">{requisitosAlta.map(req => { const doc = detail.documentos.find(d => d.Tipo === req.tipo); return <article key={req.tipo} className="aa-doc-card"><h4><FileText size={17} />{req.nombre}</h4>{doc ? <><span className="aa-doc-state">{doc.Estado}</span><Documento documento={doc} onError={setModalError} />{doc.MotivoRechazo && <p className="aa-error">{doc.MotivoRechazo}</p>}</> : <div className="aa-missing"><FileText size={28} /><p>Aún no presentado</p></div>}</article> })}</div>
        {detail.tramite.Estado === 'EnRevision' ? <section className="aa-decision"><div><h3>Resultado de la revisión</h3><p>Verificá que los tres documentos sean legibles y correspondan al solicitante.</p></div><label>Motivo de rechazo <span>(solo si rechazás el alta)</span><select disabled={busy} value={reason} onChange={e => setReason(e.target.value)}><option value="">Seleccioná un motivo</option>{reasons.map(m => <option key={m.Codigo} value={m.Codigo}>{m.Nombre}</option>)}</select></label></section> : <p className="aa-warning">{detail.tramite.Estado === 'Aprobada' ? 'Esta cuenta ya fue habilitada.' : detail.tramite.Estado === 'Rechazada' ? 'El solicitante debe corregir la documentación y volver a enviarla.' : 'Podrás decidir el alta cuando el socio envíe su documentación a revisión.'}</p>}</>}
      </div>
      <footer className="aa-modal-footer"><button className="aa-button" disabled={busy} onClick={close}>Cerrar</button>{detail?.tramite.Estado === 'EnRevision' && <div><button className="aa-reject" disabled={busy || !reason} onClick={() => decide(false)}>Rechazar alta</button><button className="aa-approve" disabled={busy || !requisitosAlta.every(req => { const doc = detail.documentos.find(d => d.Tipo === req.tipo); return doc && doc.Estado !== 'Rechazado' })} onClick={() => decide(true)}>{busy ? <Loader2 className="aa-spin" size={17} /> : <CheckCircle2 size={17} />}{busy ? 'Guardando…' : 'Aprobar alta'}</button></div>}</footer>
    </dialog>}
  </div>
}
