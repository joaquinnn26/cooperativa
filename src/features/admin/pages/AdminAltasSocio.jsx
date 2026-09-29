import React, { useEffect, useState } from 'react'
import { altaSocioApi } from '@/utils/altaSocioApi.js'
import { estadosAlta, requisitosAlta } from '@/utils/altaSocio.js'
import DocumentoAltaPreview from '@/features/admin/components/DocumentoAltaPreview.jsx'
import { motivosRechazoAlta, validarRechazoAlta } from '@/utils/rechazoAlta.js'

export default function AdminAltasSocio() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [filter, setFilter] = useState('EnRevision')
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    altaSocioApi('', { signal: abort.signal }).then(result => { if (!abort.signal.aborted) setRows(result) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [revision])
  async function abrir(row) {
    setBusy(true); setError(''); setDetail(null); setSelected(row); setMotivo(''); setObservacion(''); setMessage('')
    try { setDetail(await altaSocioApi(`/${row.idUsuarioSistema}`)) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function decidir(aprobar) {
    const validationError = aprobar ? '' : validarRechazoAlta(motivo, observacion)
    if (validationError) { setError(validationError); return }
    setBusy(true); setError('')
    try {
      const result = await altaSocioApi(`/${selected.idUsuarioSistema}/decision`, { method: 'POST', body: JSON.stringify({ Aprobar: aprobar, Motivo: aprobar ? null : motivo, Observacion: aprobar ? null : observacion.trim() || null, Version: detail.tramite.Version }) })
      setMessage(result.Message); setSelected(null); setDetail(null); setRevision(r => r + 1)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Altas de socios</h1><p className="mt-2 text-gray-600">Revisá la constancia de domicilio y ambos lados del DNI antes de aprobar el alta.</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    <div className="flex flex-wrap gap-4"><label>Estado<select className="input-field" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos</option>{Object.entries(estadosAlta).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="btn-secondary" disabled={busy || loading} onClick={() => { setError(''); setSelected(null); setDetail(null); setRevision(r => r + 1) }}>Actualizar</button></div>
    {loading ? <p>Cargando solicitudes…</p> : <div className="grid gap-3 md:grid-cols-2">{rows.filter(row => !filter || row.Estado === filter).map(row => <article className="card space-y-2" key={row.idUsuarioSistema}><h2 className="font-semibold">{row.Nombre} {row.Apellido}</h2><p>{row.Email}</p><p>{estadosAlta[row.Estado]}</p><button className="btn-secondary" disabled={busy} onClick={() => abrir(row)}>Revisar trámite</button></article>)}{!rows.some(row => !filter || row.Estado === filter) && <p>No hay trámites en este estado.</p>}</div>}
    {selected && <section className="card space-y-4" aria-label="Revisión del alta">
      <h2 className="text-xl font-semibold">{selected.Nombre} {selected.Apellido}</h2>
      <p>DNI: {selected.Documento} · Teléfono: {selected.Telefono}</p><p>{selected.Email}</p><p>Domicilio: {selected.Calle} {selected.Numero} · Titular: {selected.EsTitular ? 'Sí' : 'No'}</p>
      {!detail ? <p>{busy ? 'Cargando documentos…' : 'No se pudo cargar el trámite. Volvé a seleccionarlo.'}</p> : <>
        <p className="font-semibold">{estadosAlta[detail.tramite?.Estado]}</p>
        {detail.tramite?.Motivo && <p className="whitespace-pre-wrap">Último motivo informado: {detail.tramite.Motivo}</p>}
        {detail.tramite?.Observacion && <p className="whitespace-pre-wrap">Observación adicional: {detail.tramite.Observacion}</p>}
        <div className="grid gap-4 xl:grid-cols-3">{requisitosAlta.map(requisito => {
          const doc = detail.documentos.find(d => d.Tipo === requisito.tipo)
          return doc
            ? <DocumentoAltaPreview key={doc.idDocumento} documento={doc} titulo={requisito.nombre} />
            : <div className="rounded-xl border border-dashed border-gray-300 p-4" key={requisito.tipo}><h3 className="font-semibold">{requisito.nombre}</h3><p className="mt-2 text-sm text-gray-500">Pendiente de presentación</p></div>
        })}</div>
        {detail.tramite?.Estado === 'EnRevision' && <>
          <label className="block">Motivo del rechazo (obligatorio si rechazás)
            <select className="input-field mt-2" value={motivo} onChange={e => setMotivo(e.target.value)} disabled={busy}>
              <option value="">Seleccioná un motivo</option>
              {motivosRechazoAlta.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block">Observación adicional ({motivo === 'Otro' ? 'obligatoria para Otro' : 'opcional'})
            <textarea className="input-field mt-2" value={observacion} onChange={e => setObservacion(e.target.value)} maxLength={1000} aria-required={motivo === 'Otro'} disabled={busy} />
          </label>
          <div className="flex flex-wrap gap-3"><button className="btn-primary" disabled={busy || detail.documentos.length !== 3} onClick={() => decidir(true)}>Aprobar y habilitar socio</button><button className="btn-secondary" disabled={busy || Boolean(validarRechazoAlta(motivo, observacion))} onClick={() => decidir(false)}>Rechazar documentación</button></div>
        </>}
      </>}
    </section>}
  </div>
}
