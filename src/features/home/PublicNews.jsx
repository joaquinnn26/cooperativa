import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Megaphone, Pin, X } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import { fetchPublicAnnouncements } from './publicAnnouncements.js'

function publicationDate(value) {
  if (!value) return ''
  // ASP.NET emits UTC DateTime values; interpret unspecified timestamps as UTC.
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PublicNews() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState(null)
  const [revision, setRevision] = useState(0)
  const dialog = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setItems([])
    fetchPublicAnnouncements(apiUrl('/anuncios'), { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setItems(data); setStatus('ready') } })
      .catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [revision])

  useEffect(() => {
    if (selected) dialog.current?.showModal()
  }, [selected])

  if (status === 'loading') return <div className="public-news-unavailable" role="status">Cargando novedades…</div>
  if (status === 'error') return <div className="public-news-unavailable" role="alert"><p>No se pudieron cargar las novedades. Intentá nuevamente.</p><button className="public-text-link" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>
  if (!items.length) return <div className="public-news-unavailable" role="status"><Megaphone size={30} aria-hidden="true" /><h3>No hay novedades por el momento.</h3></div>

  return <>
    <div className="public-news-list">
      {(expanded ? items : items.slice(0, 3)).map(item => <button key={item.id} type="button" className="public-news-item" onClick={() => setSelected(item)} aria-haspopup="dialog">
        <time>{publicationDate(item.date)}</time>
        <span className="public-news-copy"><strong>{item.title}</strong><span className="public-news-preview">{item.content}</span></span>
        {item.fixed && <Pin size={15} aria-label="Anuncio fijado" />}
        <ArrowRight size={17} aria-hidden="true" />
      </button>)}
    </div>
    {items.length > 3 && <button type="button" className="public-news-toggle public-text-link" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Ver menos novedades' : 'Ver todas las novedades'}<ArrowRight size={16} aria-hidden="true" /></button>}
    <dialog ref={dialog} className="public-news-dialog" aria-labelledby="public-announcement-title" onClose={() => setSelected(null)}>
      {selected && <><div className="public-news-dialog-heading"><h2 id="public-announcement-title">{selected.title}</h2><button type="button" aria-label="Cerrar anuncio" onClick={() => dialog.current.close()} autoFocus><X size={22} /></button></div><time>{publicationDate(selected.date)}</time><p>{selected.content}</p></>}
    </dialog>
  </>
}
