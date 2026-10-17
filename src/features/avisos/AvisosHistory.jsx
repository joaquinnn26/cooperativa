import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvisos } from './AvisosProvider.jsx'
import AvisosList, { AvisosActionError, AvisosFeedback } from './AvisosList.jsx'

export default function AvisosHistory() {
  const { session } = useAvisos()
  return <HistorySession key={session.scope} />
}

function HistorySession() {
  const { enabled, session, history, busy } = useAvisos()
  const [page, setPage] = useState(1)
  const [archived, setArchived] = useState(false)
  useEffect(() => {
    if (enabled) session.loadHistory({ pagina: page, incluirArchivados: archived })
    return () => session.stopHistory()
  }, [session, enabled, page, archived])
  const pages = Math.max(1, Math.ceil(history.total / 10))
  useEffect(() => { if (history.status === 'ready' && page > pages) setPage(pages) }, [history.status, page, pages])
  if (!enabled) return <p role="alert" className="mx-auto max-w-5xl p-6 text-gray-700">La cuenta actual no tiene acceso a Avisos.</p>
  return <main className="mx-auto max-w-5xl px-4 py-8">
    <Link to="/socio" className="text-sm font-semibold text-indigo-700 hover:underline">Volver al panel</Link>
    <h1 className="mt-3 text-3xl font-bold text-gray-900">Mis avisos</h1>
    <p className="mt-2 text-sm text-gray-600">Novedades personales de tus trámites. Leer o archivar un aviso no resuelve el trámite.</p>
    <label className="my-5 inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={archived} disabled={busy !== null} onChange={event => { setArchived(event.target.checked); setPage(1) }} className="rounded border-gray-300" />Incluir archivados</label>
    <section aria-label="Historial de avisos" className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <AvisosActionError />
      <AvisosFeedback status={history.status} error={history.error} empty={!history.items.length} retry={() => session.loadHistory({ pagina: page, incluirArchivados: archived })} />
      {history.status === 'ready' && <AvisosList items={history.items} allowArchive />}
    </section>
    <nav aria-label="Paginación de avisos" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <button type="button" onClick={() => setPage(value => value - 1)} disabled={page <= 1 || history.status !== 'ready' || busy !== null} className="rounded-lg border border-gray-300 bg-white px-4 py-2 disabled:opacity-50">Anterior</button>
      <span role="status">{history.status === 'ready' ? `Página ${page} de ${pages} · ${history.total} avisos` : history.status === 'error' ? 'Historial no disponible' : 'Consultando historial…'}</span>
      <button type="button" onClick={() => setPage(value => value + 1)} disabled={page >= pages || history.status !== 'ready' || busy !== null} className="rounded-lg border border-gray-300 bg-white px-4 py-2 disabled:opacity-50">Siguiente</button>
    </nav>
  </main>
}
