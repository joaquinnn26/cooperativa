import React, { useEffect, useRef, useState } from 'react'
import { meterApi, compatibleMeterType } from '@/utils/meters.js'
import { meterWorkPayload } from '@/utils/meterWorkForm.js'
import TrabajoMedidorView from './TrabajoMedidorView.jsx'
import { showInfo } from '@/utils/alerts.js'

export default function TrabajoMedidorDialog({ request, anterior = null, retirar = false, soloResultado = false, onClose, onConfirm }) {
  const dialog = useRef(null)
  const [mode, setMode] = useState('disponible')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0 })
  const [catalog, setCatalog] = useState({ tipos: [] })
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [meter, setMeter] = useState(null)
  const [nuevo, setNuevo] = useState({ Numero: '', Marca: '', Modelo: '' })
  const [duplicate, setDuplicate] = useState(null)
  const [checking, setChecking] = useState(false)
  const [verifiedNumber, setVerifiedNumber] = useState('')
  const [numberError, setNumberError] = useState('')
  const [listError, setListError] = useState('')
  const [retries, setRetries] = useState(0)
  const [lectura, setLectura] = useState('')
  const [final, setFinal] = useState('')
  const [condition, setCondition] = useState('')
  const [detalle, setDetalle] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const service = anterior?.Servicio || request?.servicioNombre
  const type = catalog.tipos.find(t => compatibleMeterType(service, t.Nombre))
  useEffect(() => { dialog.current?.showModal() }, [])
  useEffect(() => { if (error) showInfo({ title: 'Revisá los datos del medidor', message: error, type: 'error', target: dialog.current || undefined }) }, [error])
  useEffect(() => {
    const abort = new AbortController()
    setCatalogLoaded(false)
    meterApi('/catalogos', { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setCatalog(result) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setCatalogLoaded(true) })
    return () => abort.abort()
  }, [retries])
  useEffect(() => {
    if (!type || retirar || mode !== 'disponible') return
    const abort = new AbortController()
    setLoading(true); setListError(''); setData({ items: [], total: 0 })
    const timer = setTimeout(() => meterApi(`?disponibles=true&tipo=${type.idTipoMedidor}&pagina=${page}&q=${encodeURIComponent(q)}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setData(result) })
      .catch(e => { if (!abort.signal.aborted) setListError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) }), 200)
    return () => { abort.abort(); clearTimeout(timer) }
  }, [page, q, type?.idTipoMedidor, retirar, mode, retries])
  useEffect(() => {
    setVerifiedNumber(''); setNumberError(''); setDuplicate(null)
    if (mode !== 'nuevo' || !nuevo.Numero.trim()) { setChecking(false); return }
    const abort = new AbortController(), number = nuevo.Numero.trim()
    setChecking(true)
    const timer = setTimeout(() => meterApi(`?exacto=true&q=${encodeURIComponent(number)}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) { setDuplicate(result.items[0] || null); setVerifiedNumber(number) } })
      .catch(failure => { if (!abort.signal.aborted) setNumberError(failure.message) })
      .finally(() => { if (!abort.signal.aborted) setChecking(false) }), 300)
    return () => { abort.abort(); clearTimeout(timer) }
  }, [mode, nuevo.Numero, retries])
  const numberReady = mode !== 'nuevo' || (!checking && !duplicate && !numberError && Boolean(verifiedNumber) && verifiedNumber === nuevo.Numero.trim())
  const values = { mode, type, meter, nuevo, lectura, final, condition, detalle, anterior, retirar }
  let ready = false
  let pendingText = 'Completá los campos obligatorios para continuar.'
  try {
    meterWorkPayload(values)
    ready = retirar || numberReady
    if (!ready) pendingText = checking ? 'Esperá la verificación del número.' : duplicate ? 'Elegí un número nuevo o seleccioná el equipo existente.' : 'Verificá el número del equipo para continuar.'
  } catch (failure) { pendingText = failure.message }
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    try {
      const payload = meterWorkPayload(values)
      if (!retirar && !numberReady) throw new Error('Completa la verificacion del numero antes de continuar.')
      setBusy(true)
      await onConfirm(payload)
      onClose()
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return <TrabajoMedidorView {...{ dialog, request, anterior, retirar, soloResultado, onClose, submit, mode, setMode, q, setQ, page, setPage, data, type, catalogLoaded, meter, setMeter, nuevo, setNuevo, duplicate, checking, verifiedNumber, numberError, lectura, setLectura, final, setFinal, condition, setCondition, detalle, setDetalle, error, setError, busy, loading, listError, ready, pendingText }} retry={() => { setError(''); setRetries(value => value + 1) }}/>
}
