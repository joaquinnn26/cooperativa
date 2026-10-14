import React, { useEffect, useState } from 'react'
import { apiLaboralExistente } from '@/utils/laboral.js'
import { apiUrl } from '@/config/api.js'

const currentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function LaboralFacturacionInternet() {
  const [periodo, setPeriodo] = useState(currentPeriod)
  const [lote, setLote] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError('')
  setLote(null)
  setResultado(null)
  if (!periodo) { setLoading(false); return () => abort.abort() }
    apiLaboralExistente(`/facturacion/intercambio/internet/lotes?periodo=${encodeURIComponent(periodo)}`, { signal: abort.signal })
      .then(value => { if (!abort.signal.aborted) { setLote(value); setResultado(value?.Estado === 'Validado' ? value : null) } })
      .catch(e => { if (!abort.signal.aborted) { setLote(null); setError(e.message) } })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [periodo])

  async function reload() {
    const value = await apiLaboralExistente(`/facturacion/intercambio/internet/lotes?periodo=${encodeURIComponent(periodo)}`)
    setLote(value)
    setResultado(value?.Estado === 'Validado' ? value : null)
    return value
  }

  async function createAndDownload() {
    setBusy(true); setError(''); setResultado(null)
    try {
      const created = await apiLaboralExistente('/facturacion/intercambio/internet/lotes', { method: 'POST', body: { Periodo: periodo } })
      setLote(created)
      const response = await fetch(apiUrl(`/facturacion/intercambio/internet/lotes/${created.idLote}/archivo`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!response.ok) throw new Error((await response.text()) || 'El lote quedó guardado, pero no se pudo descargar el archivo.')
      const disposition = response.headers.get('Content-Disposition') || ''
      const filename = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)?.[1] || created.NombreArchivoSalida || `internet_facturacion_${periodo}_lote-${created.idLote}.csv`
      downloadBlob(await response.blob(), decodeURIComponent(filename.replace(/"/g, '')))
    } catch (e) {
      setError(e.message)
      try { await reload() } catch { /* mantener el error original */ }
    } finally { setBusy(false) }
  }

  async function downloadExisting() {
    if (!lote?.idLote) return
    setBusy(true); setError('')
    try {
      const response = await fetch(apiUrl(`/facturacion/intercambio/internet/lotes/${lote.idLote}/archivo`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!response.ok) throw new Error((await response.text()) || 'No se pudo descargar el archivo del lote.')
      const disposition = response.headers.get('Content-Disposition') || ''
      const filename = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)?.[1] || lote.NombreArchivoSalida
      downloadBlob(await response.blob(), decodeURIComponent(filename.replace(/"/g, '')))
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function validateResponse() {
    if (!archivo) return
    setBusy(true); setError(''); setResultado(null)
    try {
      const contenido = await archivo.text()
      const validation = await apiLaboralExistente('/facturacion/intercambio/internet/importaciones/validar', {
        method: 'POST', body: { NombreArchivo: archivo.name, Contenido: contenido }
      })
      setResultado(validation)
      if (validation.Estado === 'Validado') await reload()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function applyResponse() {
    if (!resultado?.idLote || resultado.Estado !== 'Validado') return
    setBusy(true); setError('')
    try {
      const applied = await apiLaboralExistente(`/facturacion/intercambio/internet/lotes/${resultado.idLote}/aplicar`, { method: 'POST' })
      setResultado(applied)
      await reload()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function annulLot() {
    if (!lote?.idLote || lote.Estado !== 'Exportado') return
    const Motivo = window.prompt('Motivo para anular este lote y generar una nueva exportación:')
    if (!Motivo?.trim()) return
    setBusy(true); setError('')
    try {
      await apiLaboralExistente(`/facturacion/intercambio/internet/lotes/${lote.idLote}/anular`, { method: 'POST', body: { Motivo } })
      setLote(null); setResultado(null); await reload()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const stateLabel = { Exportado: 'Esperando respuesta externa', Validado: 'Respuesta validada', Aplicado: 'Facturas cargadas', Anulado: 'Anulado' }
  return <section className="card space-y-4">
    <div>
      <h2 className="font-semibold">Internet · facturación por padrón</h2>
      <p className="text-sm text-gray-600">Exportá los contratos y cargos vigentes del período, sin mediciones. Después validá e importá el CSV de facturas que devuelve el sistema contable.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">Período a facturar<input className="input-field" type="month" value={periodo} onChange={e => { setPeriodo(e.target.value); setArchivo(null); setResultado(null) }} /></label>
      <button className="btn-primary" disabled={busy || loading || !periodo} onClick={createAndDownload}>{busy ? 'Procesando…' : lote ? 'Usar lote del período' : 'Crear lote y descargar CSV'}</button>
      {lote && <button className="btn-secondary" disabled={busy || loading} onClick={downloadExisting}>Descargar CSV guardado</button>}
      <button className="btn-secondary" disabled={busy || loading} onClick={() => reload().catch(e => setError(e.message))}>Actualizar lote</button>
    </div>
    {loading && <p role="status" className="text-sm text-gray-500">Consultando lote del período…</p>}
    {lote && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>Lote #{lote.idLote} · {lote.Periodo}</strong><span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">{stateLabel[lote.Estado] || lote.Estado}</span></div>
      <p className="mt-2">{lote.CantidadFilas} contratos{lote.CantidadFacturadas != null ? ` · ${lote.CantidadFacturadas} facturados` : ''}{lote.CantidadRechazadas != null ? ` · ${lote.CantidadRechazadas} rechazados` : ''}</p>
      {lote.NombreArchivoSalida && <p className="text-slate-600">Archivo: {lote.NombreArchivoSalida}</p>}
      {!!lote.Errores?.length && <ul className="mt-2 list-disc space-y-1 pl-5 text-red-800">{lote.Errores.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul>}
      {lote.Estado === 'Exportado' && <button className="mt-3 text-sm font-semibold text-red-700 underline" disabled={busy} onClick={annulLot}>Anular lote para corregir el padrón y exportar de nuevo</button>}
    </div>}
    <div className="flex flex-wrap items-end gap-3 border-t pt-4">
      <label className="grid gap-1 text-sm">CSV de respuesta del sistema contable<input className="input-field" type="file" accept=".csv,text/csv,text/plain" onChange={e => { setArchivo(e.target.files?.[0] || null); setResultado(null); setError('') }} /></label>
      <button className="btn-secondary" disabled={busy || !archivo || !lote || lote.Estado !== 'Exportado'} onClick={validateResponse}>{busy ? 'Procesando…' : 'Validar respuesta'}</button>
      <button className="btn-primary" disabled={busy || resultado?.Estado !== 'Validado'} onClick={applyResponse}>{busy ? 'Procesando…' : 'Aplicar facturas'}</button>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {resultado && <div className={`rounded-lg p-4 text-sm ${resultado.Estado === 'Validado' || resultado.Estado === 'Aplicado' ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-950'}`}>
      <p className="font-semibold">Lote #{resultado.idLote} · {stateLabel[resultado.Estado] || resultado.Estado}</p>
      {resultado.CantidadFilas != null && <p>{resultado.CantidadValidas ?? resultado.CantidadFilas} de {resultado.CantidadFilas} filas válidas{resultado.CantidadAplicadas != null ? ` · ${resultado.CantidadAplicadas} facturas aplicadas` : ''}</p>}
      {!!resultado.Errores?.length && <ul className="mt-2 list-disc space-y-1 pl-5">{resultado.Errores.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul>}
    </div>}
    <p className="text-xs text-gray-600">El socio verá la factura y su enlace después de aplicar el lote. Abrir el enlace no confirma el pago; el estado de pago requiere un archivo de conciliación posterior.</p>
  </section>
}
