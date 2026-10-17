import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, Check, CalendarClock } from 'lucide-react'
import { useAvisos } from './AvisosProvider.jsx'
import { destinoAviso, fechaAviso, prioridadesAviso } from './avisosModel.js'

export function AvisosFeedback({ status, error, empty, retry }) {
  if (status === 'idle' || status === 'loading') return <p role="status" className="p-5 text-sm text-gray-600">Cargando avisos…</p>
  if (status === 'error') return <div role="alert" className="p-5 text-sm text-red-800">
    <p>{error}</p><button type="button" className="mt-2 font-semibold underline" onClick={retry}>Reintentar</button>
  </div>
  if (empty) return <p className="p-5 text-sm text-gray-600">No hay avisos para mostrar en esta vista.</p>
  return null
}

export function AvisosActionError() {
  const { actionError } = useAvisos()
  return actionError ? <p role="alert" className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-800">{actionError}</p> : null
}

export default function AvisosList({ items, allowArchive = false, onNavigate }) {
  const { session, busy } = useAvisos()
  const navigate = useNavigate()
  async function open(item) {
    const to = destinoAviso(item)
    // A successful PUT verifies current ownership and origin access before navigation.
    if (to && await session.mark(item.idAviso)) {
      onNavigate?.()
      navigate(to)
    }
  }
  return <ul className="divide-y divide-gray-100">
    {items.map(item => <li key={item.idAviso} className={`p-4 ${item.FechaLecturaUtc ? 'bg-white' : 'bg-indigo-50/70'}`}>
      <div className="flex items-start gap-3">
        <CalendarClock aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-indigo-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold text-gray-900">{item.Titulo}</h3>
            {!item.FechaLecturaUtc && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">No leído</span>}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">{item.Mensaje}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            <time dateTime={item.FechaCreacionUtc}>{fechaAviso(item.FechaCreacionUtc)}</time>
            <span className={item.Prioridad === 1 ? 'font-semibold text-red-800' : ''}>Prioridad {prioridadesAviso[item.Prioridad].toLowerCase()}</span>
            {item.FechaLecturaUtc && <span>Leído</span>}
            {item.FechaArchivoUtc && <span>Archivado</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!item.FechaLecturaUtc && <button type="button" disabled={busy !== null} onClick={() => session.mark(item.idAviso)} className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" aria-label={`Marcar como leído: ${item.Titulo}`}><Check size={14} aria-hidden="true" />Marcar leído</button>}
            {destinoAviso(item) && <button type="button" disabled={busy !== null} onClick={() => open(item)} className="rounded bg-indigo-700 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">Ver turno</button>}
            {allowArchive && !item.FechaArchivoUtc && <button type="button" disabled={busy !== null} onClick={() => session.mark(item.idAviso, true)} className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" aria-label={`Archivar: ${item.Titulo}`}><Archive size={14} aria-hidden="true" />Archivar</button>}
          </div>
        </div>
      </div>
    </li>)}
  </ul>
}
