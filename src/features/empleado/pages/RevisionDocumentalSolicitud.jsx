import React, { useState } from 'react'
import { FileCheck2, Download } from 'lucide-react'

export default function RevisionDocumentalSolicitud({ documents, canApprove, busy, onDownload, onApprove }) {
  const [reviewed, setReviewed] = useState([])
  const complete = documents.length > 0 && documents.every(document => reviewed.includes(document.key))
  return <section className="card space-y-4 border-amber-200 bg-amber-50/40">
    <div className="flex items-start gap-3"><FileCheck2 className="text-amber-700" size={25}/><div><h2 className="font-semibold">Revisión de documentos</h2><p className="text-sm text-gray-600">La solicitud está pendiente de aprobación documental. Revisá los archivos antes de habilitar la instalación.</p></div></div>
    {!documents.length && <p role="status" className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Faltan documentos disponibles. La solicitud seguirá pendiente hasta que se adjunten los archivos necesarios.</p>}
    {documents.map(document => <div key={document.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3"><div><strong className="block text-sm">{document.name}</strong><small className="text-gray-500">{document.type}</small><button type="button" className="mt-1 flex items-center gap-1 text-sm text-blue-700 underline" disabled={busy} onClick={() => onDownload(document.path, document.name)}><Download size={14}/>Abrir documento</button></div>{canApprove && <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={reviewed.includes(document.key)} onChange={event => setReviewed(current => event.target.checked ? [...current, document.key] : current.filter(key => key !== document.key))}/>Revisado y conforme</label>}</div>)}
    {canApprove && <form onSubmit={event => onApprove(event, documents.map(document => document.key))} className="space-y-2"><p className="text-sm text-gray-600">Confirmá que los documentos corresponden al socio y cumplen los requisitos del servicio. La aprobación quedará registrada con tu usuario y fecha.</p><button className="btn-primary" disabled={busy || !complete}>{busy ? 'Guardando…' : 'Aprobar documentos y habilitar instalación'}</button><p className="text-xs text-gray-500">Después podrás asignar un operario. Esta aprobación corresponde únicamente a esta solicitud.</p></form>}
  </section>
}
