import React, { useEffect, useId, useRef, useState } from 'react'
import { descargarDocumentoAlta, obtenerVistaDocumentoAlta } from '@/utils/altaSocioApi.js'

export default function DocumentoAltaPreview({ documento, titulo }) {
  const [vista, setVista] = useState(null)
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [revision, setRevision] = useState(0)
  const dialog = useRef(null)
  const titleId = useId()
  const { idDocumento } = documento

  useEffect(() => {
    const abort = new AbortController()
    let objectUrl
    setLoading(true)
    setError('')
    setVista(null)
    obtenerVistaDocumentoAlta({ idDocumento }, abort.signal).then(({ archivo, tipo }) => {
      if (abort.signal.aborted) return
      objectUrl = URL.createObjectURL(archivo)
      setVista({ url: objectUrl, tipo })
    }).catch(e => {
      if (!abort.signal.aborted) setError(e.message)
    }).finally(() => {
      if (!abort.signal.aborted) setLoading(false)
    })
    return () => {
      abort.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [idDocumento, revision])

  async function descargar() {
    setDownloading(true)
    setDownloadError('')
    try { await descargarDocumentoAlta(documento) }
    catch (e) { setDownloadError(e.message) }
    finally { setDownloading(false) }
  }

  const esImagen = vista?.tipo.startsWith('image/')
  return <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <h3 className="font-semibold text-gray-900">{titulo}</h3>
    <p className="break-all text-sm text-gray-500">{documento.Nombre}</p>
    {loading && <p role="status" className="rounded-lg bg-gray-50 p-6 text-sm text-gray-600">Cargando vista previa…</p>}
    {error && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      <p role="alert">{error}</p>
      <button type="button" className="mt-2 font-medium underline" onClick={() => setRevision(value => value + 1)}>Reintentar vista previa</button>
    </div>}
    {vista && !error && (esImagen ? <button
      type="button"
      className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
      onClick={() => dialog.current?.showModal()}
      aria-label={`Ampliar ${titulo}`}
    >
      <img className="h-52 w-full object-contain" src={vista.url} alt={titulo} onError={() => setError('No se pudo mostrar la imagen. Podés intentar descargarla.')} />
      <span className="mt-2 block text-sm font-medium text-blue-700">Ver imagen ampliada</span>
    </button> : <div className="space-y-2">
      <object className="h-80 w-full rounded-lg border border-gray-200" data={vista.url} type="application/pdf" aria-label={`Vista previa de ${titulo}`}>
        <p className="p-4 text-sm text-gray-600">Tu navegador no tiene un visor PDF integrado. Podés abrirlo en otra pestaña o descargarlo.</p>
      </object>
      <a href={vista.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-blue-700 underline">Abrir PDF en otra pestaña</a>
    </div>)}
    <button type="button" className="text-sm text-gray-600 underline hover:text-gray-900 disabled:opacity-50" disabled={downloading} onClick={descargar}>
      {downloading ? 'Descargando…' : 'Descargar'}
    </button>
    {downloadError && <p role="alert" className="text-sm text-red-800">{downloadError}</p>}
    {vista && esImagen && <dialog ref={dialog} aria-labelledby={titleId} className="m-auto w-[96vw] max-w-6xl max-h-[94vh] rounded-xl bg-white p-4 shadow-xl backdrop:bg-black/70" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">{titulo}</h2>
          <button type="button" autoFocus className="btn-secondary" onClick={() => dialog.current?.close()}>Cerrar</button>
        </div>
        <p className="break-all text-sm text-gray-500">{documento.Nombre}</p>
        <img className="max-h-[72vh] w-full object-contain" src={vista.url} alt={`${titulo} ampliado`} />
      </div>
    </dialog>}
  </article>
}
