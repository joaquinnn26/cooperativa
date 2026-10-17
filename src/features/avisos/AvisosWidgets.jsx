import React, { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useAvisos } from './AvisosProvider.jsx'
import AvisosList, { AvisosActionError, AvisosFeedback } from './AvisosList.jsx'

function Recent({ onNavigate, limit = 5 }) {
  const { items, status, error, session } = useAvisos()
  return <>
    <AvisosActionError />
    <AvisosFeedback status={status} error={error} empty={!items.length} retry={() => session.refresh(true)} />
    {status === 'ready' && <AvisosList items={items.slice(0, limit)} onNavigate={onNavigate} />}
    <Link to="/socio/avisos" onClick={onNavigate} className="block border-t border-gray-200 p-4 text-center text-sm font-semibold text-indigo-700 hover:bg-gray-50">Ver historial completo</Link>
  </>
}

export function AvisosCard() {
  const { noLeidos, enabled } = useAvisos()
  if (!enabled) return null
  return <aside className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <div className="flex items-center gap-2"><Bell aria-hidden="true" className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-bold text-gray-900">Avisos</h2></div>
      {noLeidos !== null && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{noLeidos} sin leer</span>}
    </div>
    <Recent limit={3} />
  </aside>
}

// This child is unmounted on every account change, including its open/focus state.
function BellSession() {
  const { noLeidos, session, status } = useAvisos()
  const [open, setOpen] = useState(false)
  const root = useRef(null), button = useRef(null), close = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    close.current?.focus()
    function keydown(event) { if (event.key === 'Escape') { setOpen(false); button.current?.focus() } }
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('keydown', keydown)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside) }
  }, [open])
  return <div className="relative" ref={root}>
    <button ref={button} type="button" aria-label={`Avisos${noLeidos !== null ? `: ${noLeidos} sin leer` : status === 'error' ? ': no disponibles' : ''}`} aria-expanded={open} aria-controls={id} onClick={() => { if (!open) session.refresh(); setOpen(!open) }} className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-indigo-700 hover:bg-indigo-50">
      <Bell className="h-5 w-5" aria-hidden="true" />
      {noLeidos > 0 && <span aria-hidden="true" className="absolute -right-2 -top-2 rounded-full bg-red-700 px-1.5 py-0.5 text-xs font-bold text-white">{noLeidos > 99 ? '99+' : noLeidos}</span>}
    </button>
    {open && <section id={id} aria-label="Avisos recientes" className="fixed left-4 right-4 top-[4.5rem] z-50 max-h-[75vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
      <div className="flex items-center justify-between border-b border-gray-200 p-4"><h2 className="font-bold text-gray-900">Mis avisos</h2><button ref={close} type="button" onClick={() => { setOpen(false); button.current?.focus() }} aria-label="Cerrar avisos" className="rounded p-2 text-gray-600 hover:bg-gray-100"><X size={18} /></button></div>
      <Recent onNavigate={() => setOpen(false)} />
    </section>}
  </div>
}

export function AvisosBell() {
  const { enabled, session } = useAvisos()
  return enabled ? <BellSession key={session.scope} /> : null
}
