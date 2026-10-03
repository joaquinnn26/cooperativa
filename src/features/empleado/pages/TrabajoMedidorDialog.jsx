import React, { useEffect, useRef, useState } from 'react'
import { meterApi, physicalStates, compatibleMeterType, isMeterAvailable } from '@/utils/meters.js'

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
  const [lectura, setLectura] = useState('')
  const [final, setFinal] = useState('')
  const [condition, setCondition] = useState('')
  const [detalle, setDetalle] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const service = anterior?.Servicio || request?.servicioNombre
  const type = catalog.tipos.find(t => compatibleMeterType(service, t.Nombre))
  const title = soloResultado ? 'Registrar resultado del trabajo' : retirar ? 'Retirar medidor' : anterior ? 'Reemplazar medidor' : 'Confirmar instalación'
  useEffect(() => { dialog.current?.showModal() }, [])
  useEffect(() => {
    const abort = new AbortController()
    meterApi('/catalogos', { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setCatalog(result) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setCatalogLoaded(true) })
    return () => abort.abort()
  }, [])
  useEffect(() => {
    if (!type || retirar || mode !== 'disponible') return
    const abort = new AbortController()
    setLoading(true); setData({ items: [], total: 0 })
    const timer = setTimeout(() => meterApi(`?disponibles=true&tipo=${type.idTipoMedidor}&pagina=${page}&q=${encodeURIComponent(q)}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setData(result) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) }), 200)
    return () => { abort.abort(); clearTimeout(timer) }
  }, [page, q, type?.idTipoMedidor, retirar, mode])
  useEffect(() => {
    if (mode !== 'nuevo' || !nuevo.Numero.trim()) { setDuplicate(null); setChecking(false); return }
    const abort = new AbortController()
    setChecking(true); setDuplicate(null)
    const timer = setTimeout(() => meterApi(`?exacto=true&q=${encodeURIComponent(nuevo.Numero.trim())}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setDuplicate(result.items[0] || null) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setChecking(false) }), 300)
    return () => { abort.abort(); clearTimeout(timer) }
  }, [mode, nuevo.Numero])
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (!retirar && (!type || (mode === 'disponible' && !meter) || (mode === 'nuevo' && (checking || duplicate)))) { setError('Seleccioná un medidor disponible o completá los datos del nuevo.'); return }
    setBusy(true)
    try {
      const selected = mode === 'nuevo' ? { NuevoMedidor: { ...nuevo, idTipoMedidor: type?.idTipoMedidor } } : { idMedidor: meter?.idMedidor, Version: meter?.Version }
      await onConfirm(retirar
        ? { Accion: 'Retirar', Version: anterior.Version, Lectura: Number(final), EstadoFisico: condition, Detalle: detalle }
        : { ...selected, Lectura: Number(lectura), Detalle: detalle,
          ...(anterior ? { VersionAnterior: anterior.Version, LecturaFinal: Number(final), EstadoRetirado: condition } : {}) })
      onClose()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop:bg-black/40" aria-labelledby="install-meter-title" onCancel={e => { if (busy) e.preventDefault(); else onClose() }}>
    <form className="space-y-5" onSubmit={submit}>
      <header><h2 className="font-bold text-xl" id="install-meter-title">{title}</h2><p className="mt-2">{anterior?.Socio || request?.socioNombre} · {service}</p><p className="text-sm text-gray-600">{anterior?.Direccion || request?.direccion || 'Domicilio no informado'}</p></header>
      <fieldset disabled={busy} className="space-y-5">
        {anterior && <section className="p-4 bg-gray-50 rounded-lg space-y-3"><h3 className="font-semibold">1. Medidor que retiraste: {anterior.Numero}</h3>
          <label className="block">Lectura final<input autoFocus required type="number" min="0" step="0.01" className="input-field" value={final} onChange={e => setFinal(e.target.value)} /></label>
          <label className="block">¿En qué condiciones quedó?<select required className="input-field" value={condition} onChange={e => setCondition(e.target.value)}><option value="">Seleccionar</option>{['Operativo', 'PendienteRevision', 'Averiado'].map(k => <option key={k} value={k}>{physicalStates[k]}</option>)}</select></label>
          {condition === 'Operativo' && <p className="text-sm">Podrá reutilizarse si sus datos físicos están confirmados.</p>}
        </section>}
        {!retirar && <section className="space-y-3"><h3 className="font-semibold">{anterior ? '2. ' : ''}Medidor que instalaste</h3>
          <div className="flex flex-wrap gap-2">{[['disponible', 'Elegir del inventario'], ['nuevo', 'Registrar medidor nuevo']].map(([value, label]) => <button type="button" key={value} aria-pressed={mode === value} className={mode === value ? 'btn-primary' : 'btn-secondary'} onClick={() => { setMode(value); setError('') }}>{label}</button>)}</div>
          {mode === 'disponible' ? <>
            {meter && <p className="p-3 bg-cyan-50 rounded-lg">Seleccionado: <strong>{meter.Numero}</strong> · {meter.Usado ? 'Usado' : 'Nuevo'}</p>}
            <label className="block">Buscar por número, marca o modelo<input className="input-field" maxLength={100} value={q} onChange={e => { setQ(e.target.value); setPage(1) }} /></label>
            {!type ? <p role="status">{catalogLoaded ? 'No se pudo determinar el tipo de medidor para este servicio. Revisá la configuración del servicio.' : 'Cargando tipos de medidor…'}</p> : loading ? <p role="status">Buscando medidores compatibles…</p> : <>
              <label className="block">Medidor disponible<select required={!meter} className="input-field" value={data.items.some(m => m.idMedidor === meter?.idMedidor) ? meter.idMedidor : ''} onChange={e => setMeter(data.items.find(m => String(m.idMedidor) === e.target.value) || null)}><option value="">Seleccionar</option>{data.items.map(m => <option key={m.idMedidor} value={m.idMedidor}>{m.Numero} · {m.Usado ? 'Usado' : 'Nuevo'} · {m.Marca || m.Tipo}</option>)}</select></label>
              {!data.total && <p>No hay medidores disponibles para esta búsqueda. Si instalaste un equipo nuevo, registralo con la opción de arriba.</p>}
              {data.total > 25 && <div className="flex justify-between"><button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page}</span><button type="button" disabled={page * 25 >= data.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>}
            </>}
          </> : <>
            <p className="text-sm text-gray-600">Se registrará como medidor de {type?.Nombre || service} y quedará instalado al confirmar.</p>
            {['Numero', 'Marca', 'Modelo'].map(key => <label className="block" key={key}>{key === 'Numero' ? 'Número que figura en el medidor' : `${key} (opcional)`}<input required={key === 'Numero'} maxLength={key === 'Numero' ? 50 : 100} className="input-field" value={nuevo[key]} onChange={e => setNuevo(n => ({ ...n, [key]: e.target.value }))} /></label>)}
            {checking && <p role="status">Comprobando número…</p>}
            {duplicate && <div className="p-3 bg-amber-50 text-amber-900"><p>El medidor {duplicate.Numero} ya está registrado.</p>{isMeterAvailable(duplicate) && compatibleMeterType(service, duplicate.Tipo) ? <button type="button" className="underline" onClick={() => { setMeter(duplicate); setMode('disponible') }}>Usar este medidor del inventario</button> : <p>Está instalado, requiere revisión o no corresponde a este servicio. Elegí otro equipo.</p>}</div>}
          </>}
          <label className="block">Lectura inicial del equipo instalado<input required type="number" min="0" step="0.01" className="input-field" value={lectura} onChange={e => setLectura(e.target.value)} /></label>
        </section>}
        <label className="block">Observaciones del trabajo (opcional)<textarea maxLength={1000} className="input-field" value={detalle} onChange={e => setDetalle(e.target.value)} /></label>
        <p className="p-3 rounded-lg bg-blue-50 text-sm">{soloResultado ? 'Estos datos se adjuntarán al resultado de la tarea. El encargado los revisará y confirmará la operación al cerrar el trabajo.' : retirar ? 'Se registrará el retiro y se conservará el historial. Esta acción no da de baja el servicio del socio.' : anterior ? 'Al confirmar, el medidor anterior se retirará y el elegido quedará instalado en la misma conexión. Ambos conservarán su historial.' : 'Al confirmar, se completará la instalación de esta solicitud y el medidor quedará asignado a su conexión.'}</p>
      </fieldset>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy || (!retirar && (!type || (mode === 'nuevo' && (checking || !!duplicate))))}>{busy ? 'Guardando…' : soloResultado ? 'Adjuntar resultado' : retirar ? 'Confirmar retiro' : anterior ? 'Confirmar reemplazo' : 'Confirmar instalación'}</button></div>
    </form>
  </dialog>
}
