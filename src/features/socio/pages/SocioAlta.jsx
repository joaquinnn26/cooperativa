import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { altaSocioApi, descargarDocumentoAlta } from '@/utils/altaSocioApi.js'
import { archivoPayload } from '@/utils/laboral.js'
import { estadosAlta, puedeEnviarAlta, requisitosAlta } from '@/utils/altaSocio.js'
import useAuthStore from '@/store/authStore.js'

export default function SocioAlta() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const updateAltaSocio = useAuthStore(state => state.updateAltaSocio)

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError('')
    altaSocioApi('/mi-tramite', { signal: abort.signal }).then(result => {
      if (!abort.signal.aborted) {
        setData(result)
        updateAltaSocio(result.tramite)
      }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [revision, updateAltaSocio])

  async function upload(event, tipo) {
    event.preventDefault()
    const form = event.currentTarget
    const file = form.elements.archivo.files[0]
    setBusy(true); setError(''); setMessage('')
    try {
      const payload = await archivoPayload(file)
      const result = await altaSocioApi('/documentos', { method: 'POST', body: JSON.stringify({
        Tipo: tipo, Nombre: payload.Nombre, Mime: payload.Tipo, Base64: payload.Base64, Version: data.tramite.Version
      }) })
      setMessage(result.Message)
      form.reset()
      setRevision(r => r + 1)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function enviar() {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await altaSocioApi('/enviar', { method: 'POST', body: JSON.stringify({ Version: data.tramite.Version }) })
      setMessage(result.Message)
      setRevision(r => r + 1)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const alta = data?.tramite
  const documentos = data?.documentos || []
  const editable = ['PendienteDocumentacion', 'Rechazada'].includes(alta?.Estado)
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-2xl font-bold">Mi alta de socio</h1><p className="mt-2 text-gray-600">Presentá tu documentación. Administración debe aprobarla para habilitar el panel completo.</p></div>
    <button className="btn-secondary" disabled={busy || loading} onClick={() => setRevision(r => r + 1)}>Actualizar estado</button>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    {loading ? <p>Cargando trámite…</p> : data && <>
      {!alta || alta.Estado === 'Aprobada' ? <div className="card space-y-3"><h2 className="font-semibold">Tu cuenta de socio está habilitada</h2><Link className="btn-primary inline-block" to="/socio">Ir al panel completo</Link></div> : <>
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Estado: {alta.Estado === 'Rechazada' ? 'Rechazada' : estadosAlta[alta.Estado] || alta.Estado}</h2>
          <p>Titular del domicilio: {alta.EsTitular ? 'Sí' : 'No'}</p>
          {alta.Motivo && <div role="status" className="space-y-2 rounded-lg bg-amber-50 p-4 text-amber-900">
            <strong>{alta.Estado === 'Rechazada' ? 'Motivo del rechazo:' : 'Motivo de la última revisión:'}</strong><p className="whitespace-pre-wrap">{alta.Motivo}</p>
            {alta.Observacion && <><strong className="block">Observación adicional:</strong><p className="whitespace-pre-wrap">{alta.Observacion}</p></>}
          </div>}
          {alta.Estado === 'EnRevision' ? <p>Recibimos los documentos. Podés consultar aquí el resultado de la revisión.</p> : <p>Cargá los tres documentos y presioná «Enviar a revisión». Si hubo un rechazo, reemplazá los archivos que debés corregir.</p>}
        </section>
        {requisitosAlta.map(requisito => {
          const doc = documentos.find(d => d.Tipo === requisito.tipo)
          return <section className="card space-y-3" key={requisito.tipo}>
            <h2 className="font-semibold">{requisito.nombre}</h2>
            {doc ? <button className="text-blue-700 underline" onClick={async () => { try { await descargarDocumentoAlta(doc) } catch (e) { setError(e.message) } }}>{doc.Nombre}</button> : <p className="text-amber-800">Falta cargar este documento.</p>}
            {editable && <form className="space-y-3" onSubmit={event => upload(event, requisito.tipo)}>
              <label className="block">{doc ? 'Reemplazar archivo' : 'Seleccionar archivo'} — PDF, PNG o JPEG, hasta 2 MB
                <input className="input-field mt-2" name="archivo" type="file" required accept="application/pdf,image/png,image/jpeg" disabled={busy} />
              </label><button className="btn-secondary" disabled={busy}>{busy ? 'Procesando…' : doc ? 'Guardar reemplazo' : 'Guardar documento'}</button>
            </form>}
          </section>
        })}
        {editable && <button className="btn-primary" disabled={busy || !puedeEnviarAlta(alta, documentos)} onClick={enviar}>Enviar a revisión</button>}
      </>}
    </>}
  </div>
}
