import React, { useEffect, useState } from 'react'
import { Check, CheckCircle2, UploadCloud, FileText, ArrowUpRight, Trash2, Loader2, ShieldCheck, Clock3, AlertCircle, Home, CreditCard, Send } from 'lucide-react'
import './SocioAlta.css'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { altaSocioApi } from '@/utils/altaSocioApi.js'
import { apiUrl } from '@/config/api.js'
import { archivoPayload } from '@/utils/laboral.js'
import { estadosAlta, puedeEnviarAlta, requisitosAlta } from '@/utils/altaSocio.js'

function VistaPrevia({ archivo, documento }) {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const abort = new AbortController()
    let url
    setPreview(null)
    setError('')
    async function cargar() {
      try {
        let blob = archivo
        if (!blob) {
          const response = await fetch(apiUrl(`/alta-socio/documentos/${documento.idDocumento}`), {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            cache: 'no-store', signal: abort.signal
          })
          if (!response.ok) throw new Error('No se pudo cargar la vista previa.')
          blob = await response.blob()
        }
        if (abort.signal.aborted) return
        url = URL.createObjectURL(blob)
        setPreview({ url, mime: blob.type })
      } catch (e) { if (!abort.signal.aborted) setError(e.message) }
    }
    cargar()
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url) }
  }, [archivo, documento?.idDocumento])
  const nombre = archivo?.name || documento?.Nombre || 'Documento'
  if (error) return <p role="alert" className="text-red-700">{error}</p>
  if (!preview) return <p>Cargando vista previa…</p>
  return <div className="space-y-2">
    {preview.mime.startsWith('image/')
      ? <img src={preview.url} alt={`Vista previa de ${nombre}`} className="alta-preview-media" />
      : <iframe src={preview.url} title={`Vista previa de ${nombre}`} className="alta-preview-media" />}
    <a href={preview.url} target="_blank" rel="noreferrer" className="alta-preview-link">Ver documento completo <ArrowUpRight size={16} aria-hidden="true" /></a>
  </div>
}

export default function SocioAlta() {
  const [data, setData] = useState(null)
  const [pendientes, setPendientes] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const updateAltaSocio = useAuthStore(state => state.updateAltaSocio)
  useEffect(() => {
    const abort = new AbortController()
    altaSocioApi('/mi-tramite', { signal: abort.signal }).then(d => {
      if (!abort.signal.aborted) { setData(d); updateAltaSocio(d.tramite) }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) })
    return () => abort.abort()
  }, [updateAltaSocio])
  useEffect(() => {
    if (!Object.keys(pendientes).length) return
    const advertir = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', advertir)
    return () => window.removeEventListener('beforeunload', advertir)
  }, [pendientes])

  function seleccionar(archivo, tipo) {
    if (!archivo || busy) return
    setError(''); setMessage('')
    if (!archivo.size || archivo.size > 2 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(archivo.type)) {
      setError('Elegí un PDF, PNG o JPEG no vacío de hasta 2 MB.')
      return
    }
    setPendientes(prev => ({ ...prev, [tipo]: archivo }))
  }
  async function actualizar() {
    const d = await altaSocioApi('/mi-tramite')
    setData(d); updateAltaSocio(d.tramite)
    return d
  }
  async function enviar() {
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      let actual = await actualizar()
      for (const [tipo, archivo] of Object.entries(pendientes)) {
        const payload = await archivoPayload(archivo)
        await altaSocioApi('/documentos', { method: 'POST', body: JSON.stringify({
          Tipo: tipo, Nombre: payload.Nombre, Mime: payload.Tipo, Base64: payload.Base64, Version: actual.tramite.Version
        }) })
        // No volver a subir archivos confirmados si falla un paso posterior.
        setPendientes(prev => { const next = { ...prev }; delete next[tipo]; return next })
        actual = await actualizar()
      }
      const r = await altaSocioApi('/enviar', { method: 'POST', body: JSON.stringify({ Version: actual.tramite.Version }) })
      setMessage(r.Message || 'Documentación enviada a revisión.')
      await actualizar()
    } catch (e) {
      setError(`${e.message} Los archivos pendientes se conservan mientras permanezcas en esta pantalla.`)
      try { await actualizar() } catch { /* Conservar el estado local si no hay conexión. */ }
    } finally { setBusy(false) }
  }
  const alta = data?.tramite
  const documentos = data?.documentos || []
  const editable = ['PendienteDocumentacion', 'Rechazada'].includes(alta?.Estado)
  const documentosPreparados = [
    ...Object.keys(pendientes).map(Tipo => ({ Tipo, Estado: 'Pendiente' })),
    ...documentos
  ]
  const completos = requisitosAlta.filter(req => documentosPreparados.find(d => d.Tipo === req.tipo)?.Estado && documentosPreparados.find(d => d.Tipo === req.tipo)?.Estado !== 'Rechazado').length
  const enRevision = alta?.Estado === 'EnRevision'
  const aprobada = alta?.Estado === 'Aprobada'
  const pasos = ['Prepará tus documentos', 'Revisión administrativa', 'Cuenta habilitada']
  const paso = aprobada ? 2 : enRevision ? 1 : 0
  return <div className="alta-page" aria-busy={busy}>
    <header className="alta-hero">
      <div className="alta-eyebrow"><ShieldCheck size={16} aria-hidden="true" /> TU CUENTA, PASO A PASO</div>
      <h1>Mi alta de socio</h1>
      <p>Un paso más para ser parte. Prepará tu documentación y nosotros nos ocupamos de revisarla.</p>
      <ol className="alta-steps" aria-label="Progreso del alta">
        {pasos.map((texto, index) => <li key={texto} className={index <= paso ? 'is-current' : ''} aria-current={index === paso ? 'step' : undefined}>
          <span className="alta-step-number">{index < paso ? <Check size={17} aria-hidden="true" /> : index + 1}</span><span>{texto}</span>
        </li>)}
      </ol>
    </header>
    {error && <div role="alert" className="alta-notice alta-notice-error"><AlertCircle size={20} aria-hidden="true" /><p>{error}</p></div>}
    {message && <div role="status" className="alta-notice alta-notice-success"><CheckCircle2 size={20} aria-hidden="true" /><p>{message}</p></div>}
    {!data ? <div className="alta-empty" role="status"><Loader2 className="alta-spin" size={28} /><p>Cargando tu trámite…</p></div> : aprobada
      ? <section className="alta-empty alta-approved"><CheckCircle2 size={48} /><h2>¡Ya sos parte!</h2><p>Tu cuenta está habilitada. Ya podés gestionar tus servicios.</p><Link to="/socio" className="alta-submit">Ir a mi panel <ArrowUpRight size={18} /></Link></section>
      : <>
        <section className="alta-overview">
          <div><span className={`alta-badge ${enRevision ? 'alta-badge-blue' : ''}`}>{enRevision ? <Clock3 size={14} /> : <FileText size={14} />}{estadosAlta[alta?.Estado] || alta?.Estado}</span>
            <h2>{enRevision ? 'Recibimos tu documentación' : 'Tus documentos'}</h2>
            <p>{enRevision ? 'Administración está revisando tu trámite. Podés consultar los archivos que enviaste.' : 'Seleccioná archivos legibles, completos y sin reflejos.'}</p>
            <span className="alta-owner"><Home size={14} aria-hidden="true" />{alta?.EsTitular ? 'Titular del domicilio' : 'No titular del domicilio'}</span>
          </div>
          <div className="alta-progress"><div><strong>{completos} de 3</strong><span>documentos {enRevision ? 'presentados' : 'preparados'}</span></div><div role="progressbar" aria-label="Documentos preparados" aria-valuemin={0} aria-valuemax={3} aria-valuenow={completos} className="alta-progress-track"><span style={{ width: `${completos / 3 * 100}%` }} /></div></div>
        </section>
        {alta?.Motivo && <div className="alta-notice alta-notice-warning"><AlertCircle size={20} /><p><strong>Revisá esta observación:</strong> {alta.Motivo}</p></div>}
        <div className="alta-document-grid">
        {requisitosAlta.map((req, index) => {
          const doc = documentos.find(d => d.Tipo === req.tipo)
          const archivo = pendientes[req.tipo]
          const listo = Boolean(archivo || (doc && doc.Estado !== 'Rechazado'))
          const Icono = req.tipo === 'Domicilio' ? Home : CreditCard
          return <section className={`alta-document ${listo ? 'is-ready' : ''}`} key={req.tipo} style={{ '--card-index': index }}>
            <div className="alta-document-heading"><span className="alta-document-icon"><Icono size={22} aria-hidden="true" /></span><span className={`alta-document-status ${listo ? 'is-ready' : ''}`}>{listo ? <CheckCircle2 size={14} /> : <span className="alta-status-dot" />}{archivo ? 'Listo para enviar' : doc ? doc.Estado : 'Pendiente'}</span></div>
            <h3>{req.nombre}</h3><p className="alta-document-hint">{req.tipo === 'Domicilio' ? 'Comprobante con tu dirección visible.' : req.tipo === 'DniFrente' ? 'La cara donde aparecen tu foto y tus datos.' : 'El reverso del documento, sin recortes.'}</p>
            {archivo || doc ? <div className="alta-file-selected">
              <VistaPrevia archivo={archivo} documento={doc} />
              <div className="alta-filename"><FileText size={16} aria-hidden="true" /><span title={archivo?.name || doc?.Nombre}>{archivo?.name || doc?.Nombre}</span>{archivo && <small>{Math.max(1, Math.round(archivo.size / 1024))} KB</small>}</div>
              {!archivo && doc?.MotivoRechazo && <p className="alta-document-rejection">{doc.MotivoRechazo}</p>}
            </div> : null}
            {editable && (archivo
              ? <button type="button" className="alta-remove" disabled={busy} onClick={() => setPendientes(prev => { const next = { ...prev }; delete next[req.tipo]; return next })}><Trash2 size={15} aria-hidden="true" />Quitar archivo</button>
              : <label className={`alta-dropzone ${doc ? 'alta-dropzone-compact' : ''} ${busy ? 'is-disabled' : ''}`} onDragOver={event => { event.preventDefault(); if (!busy) event.currentTarget.classList.add('is-dragging') }} onDragLeave={event => event.currentTarget.classList.remove('is-dragging')} onDrop={event => { event.preventDefault(); event.currentTarget.classList.remove('is-dragging'); seleccionar(event.dataTransfer.files?.[0], req.tipo) }}>
                <input type="file" aria-label={`${doc ? 'Reemplazar' : 'Cargar'} ${req.nombre}`} accept="application/pdf,image/png,image/jpeg" disabled={busy} onChange={event => { seleccionar(event.target.files?.[0], req.tipo); event.target.value = '' }} />
                <span className="alta-upload-icon"><UploadCloud size={26} aria-hidden="true" /></span><strong>{doc ? 'Reemplazar documento' : 'Elegí o arrastrá tu archivo'}</strong><span>PDF, JPG o PNG · Hasta 2 MB</span><span className="alta-select-label">{doc ? 'Elegir otro archivo' : 'Seleccionar archivo'}</span>
              </label>)}
          </section>
        })}
        </div>
        {editable && <footer className="alta-actionbar">
          <div className="alta-action-copy"><span className={`alta-action-icon ${completos === 3 ? 'is-ready' : ''}`}>{completos === 3 ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}</span><div><strong>{busy ? 'Estamos enviando tus documentos' : completos === 3 ? 'Todo listo para el siguiente paso' : `Falta${3 - completos === 1 ? '' : 'n'} ${3 - completos} documento${3 - completos === 1 ? '' : 's'}`}</strong><p role="status">{busy ? 'Mantené esta pantalla abierta hasta terminar.' : Object.keys(pendientes).length ? 'Tus archivos se enviarán al confirmar. No cierres esta pantalla.' : 'Completá los tres requisitos para enviar tu solicitud.'}</p></div></div>
          <button className="alta-submit" disabled={busy || !puedeEnviarAlta(alta, documentosPreparados)} onClick={enviar}>{busy ? <Loader2 className="alta-spin" size={18} /> : <Send size={18} />} {busy ? 'Enviando…' : 'Enviar a revisión'}</button>
        </footer>}
      </>}
  </div>
}

