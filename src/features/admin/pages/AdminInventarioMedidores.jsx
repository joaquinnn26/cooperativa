import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { meterApi, meterActions, physicalStates, allowedMeterActions, meterStatus } from '@/utils/meters.js'
import { normalizeRole } from '@/utils/auth.js'

export default function AdminInventarioMedidores() {
  const admin = normalizeRole(useAuthStore(s => s.rol)) === 'Administrador'
  const [params] = useSearchParams()
  const [view, setView] = useState('Disponibles')
  const [rows, setRows] = useState({ items: [], total: 0 })
  const [catalog, setCatalog] = useState({ tipos: [], motivos: [] })
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [motivo, setMotivo] = useState({ Nombre: '', Accion: 'Alta' })
  const [formError, setFormError] = useState('')
  const dialog = useRef(null)
  const detailSection = useRef(null)
  const detailRequest = useRef(0)
  useEffect(() => { if (detail) detailSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [detail])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError('')
    const timer = setTimeout(() => Promise.all([meterApi(`?estado=${view}&pagina=${page}&q=${encodeURIComponent(q)}`, { signal: abort.signal }), meterApi('/catalogos', { signal: abort.signal })])
      .then(([list, cats]) => { if (!abort.signal.aborted) { setRows(list); setCatalog(cats) } })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) }), 250)
    return () => { clearTimeout(timer); abort.abort() }
  }, [page, q, revision, view])
  useEffect(() => {
    if (form && !dialog.current?.open) dialog.current?.showModal()
  }, [form])
  useEffect(() => { const id = Number(params.get('medidor')); if (id > 0) openDetail(id) }, [params])
  async function openDetail(id) {
    setError('')
    const requestId = ++detailRequest.current
    try { const data = await meterApi(`/${id}`); if (requestId === detailRequest.current) setDetail(data) } catch (e) { if (requestId === detailRequest.current) setError(e.message) }
  }
  function openAction(Accion, meter = null) {
    setFormError('')
    setForm({ Accion, idMedidor: meter?.idMedidor, Numero: meter?.IdentidadVerificada ? meter.Numero : '', Marca: meter?.Marca || '', Modelo: meter?.Modelo || '',
      idTipoMedidor: meter?.idTipoMedidor || '', Version: meter?.Version || null, idMotivo: '', Detalle: '', ReferenciaTrabajo: '',
      EstadoFisico: '', idServicioSocio: '', Lectura: '', Fecha: '', label: meter?.Numero || '' })
  }
  async function save(event) {
    event.preventDefault(); if (busy) return
    setBusy(true); setFormError(''); setNotice('')
    try {
      const payload = { ...form, idMotivo: Number(form.idMotivo), idTipoMedidor: Number(form.idTipoMedidor),
        idServicioSocio: form.idServicioSocio ? Number(form.idServicioSocio) : null, Lectura: form.Lectura === '' ? null : Number(form.Lectura),
        Fecha: form.Fecha ? new Date(form.Fecha).toISOString() : null }
      const updated = await meterApi(form.idMedidor ? `/${form.idMedidor}/eventos` : '', { method: 'POST', body: JSON.stringify(payload) })
      setForm(null); setRevision(r => r + 1); setNotice('Movimiento guardado con su historial.'); await openDetail(updated.idMedidor)
    } catch (e) { setFormError(e.message) } finally { setBusy(false) }
  }
  async function saveReason(item) {
    if (busy) return
    setBusy(true); setError('')
    try { await meterApi('/motivos', { method: 'POST', body: JSON.stringify(item) }); setRevision(r => r + 1); setMotivo({ Nombre: '', Accion: 'Alta' }) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">Medidores</h1><p className="mt-1 text-gray-600">Administrá los equipos y consultá su historial. Para instalar, reemplazar o retirar, ingresá a Instalaciones.</p></header>
    {notice && <p role="status" className="p-3 bg-green-50 text-green-800 rounded-lg">{notice}</p>}
    {error && <p role="alert" className="p-3 bg-red-50 text-red-800 rounded-lg">{error}</p>}
    <section className="card space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Estado de medidores">{[['Disponibles', 'Disponibles'], ['Instalados', 'Instalados'], ['Revision', 'Por revisar'], ['Baja', 'Baja definitiva'], ['Todos', 'Todos']].map(([value, label]) => <button key={value} aria-pressed={view === value} className={view === value ? 'btn-primary' : 'btn-secondary'} onClick={() => { setView(value); setPage(1) }}>{label}</button>)}</div>
      <div className="flex gap-3 flex-wrap items-end"><label className="flex-1">Buscar número, marca, modelo o socio<input className="input-field mt-1" maxLength={100} value={q} onChange={e => { setQ(e.target.value); setPage(1) }} /></label><button className="btn-secondary" onClick={() => setRevision(r => r + 1)}>Actualizar</button>{admin && <button className="btn-primary" disabled={loading || !!error} onClick={() => openAction('Alta')}>Registrar medidor</button>}</div>
      {loading ? <p role="status">Cargando…</p> : !error && <><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr>{['Número', 'Tipo / marca / modelo', 'Estado', 'Ubicación', 'Acciones'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>
        {rows.items.map(m => <tr key={m.idMedidor} className="border-t"><td className="p-3 font-medium">{m.Numero}{!m.IdentidadVerificada && <p className="text-amber-800 text-xs">Identidad física pendiente de verificar</p>}</td><td className="p-3">{m.Tipo}<br />{m.Marca || 'Marca no informada'} · {m.Modelo || 'Modelo no informado'}</td><td className="p-3">{meterStatus(m)}{m.idAsignacion && m.EstadoFisico !== 'Operativo' && <p className="text-xs text-amber-800">{physicalStates[m.EstadoFisico]}</p>}</td><td className="p-3">{m.idAsignacion ? <>{m.Socio} · {m.Servicio}<p className="text-xs text-gray-600">{m.Direccion || `Conexión #${m.idServicioSocio}`}</p></> : 'En inventario'}</td><td className="p-3"><button className="text-blue-700 underline" onClick={() => openDetail(m.idMedidor)}>Ver ficha de {m.Numero}</button></td></tr>)}
      </tbody></table></div>{!rows.total && <p>No hay medidores en esta vista. Revisá las otras pestañas o registrá un equipo.</p>}<div className="flex items-center justify-between"><button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{rows.total} medidores · Página {page}</span><button className="btn-secondary" disabled={page * 25 >= rows.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></div></>}
    </section>
    {detail && <section ref={detailSection} className="card space-y-4" aria-label="Ficha del medidor"><div className="flex justify-between"><h2 className="text-xl font-bold">Medidor {detail.ficha.Numero}</h2><button className="text-blue-700" onClick={() => { detailRequest.current++; setDetail(null) }}>Cerrar ficha</button></div>
      <p>{meterStatus(detail.ficha)} · {physicalStates[detail.ficha.EstadoFisico]} · {detail.ficha.idAsignacion ? `Instalado en conexión #${detail.ficha.idServicioSocio}` : 'Sin instalación activa'}</p>
      {!detail.ficha.IdentidadVerificada && <p className="p-3 bg-amber-50 text-amber-900">Registro anterior: su número puede haber sido generado por el sistema. Verificá el número físico antes de habilitar su reutilización.</p>}
      {detail.ficha.PendienteConciliacion && <p className="p-3 bg-red-50 text-red-800">Esta conexión tenía varios medidores activos antes de la actualización. Sus referencias se conservaron. Verificá cuáles están realmente instalados; no se permiten nuevas instalaciones hasta resolver el conflicto.</p>}
      <div className="flex flex-wrap gap-2">{allowedMeterActions(detail.ficha, admin).map(action => <button className="btn-secondary" key={action} disabled={busy} onClick={() => openAction(action, detail.ficha)}>{meterActions[action]}</button>)}</div>
      {detail.ficha.idAsignacion && <p>{detail.ficha.Socio} · {detail.ficha.Servicio} · {detail.ficha.Direccion}</p>}
      <Link className="text-blue-700 underline inline-block" to={admin ? '/admin/instalaciones' : '/empleado/instalaciones'}>Ir a Instalaciones para registrar trabajos técnicos</Link>
      <h3 className="font-semibold">Instalaciones anteriores y actual</h3>
      {detail.asignaciones.map(a => <div key={a.idAsignacion} className="border rounded-lg p-3 text-sm">Conexión #{a.idServicioSocio} · {a.Socio} · {a.Servicio} · {a.Direccion || 'Domicilio no informado'} · {a.Cerrada ? 'Retirado' : 'Instalación activa'}<br />Inicio: {a.FechaInicio ? new Date(a.FechaInicio).toLocaleString('es-AR') : 'No informado'} · Retiro: {a.FechaFin ? new Date(a.FechaFin).toLocaleString('es-AR') : '—'}<br />Lecturas: {a.LecturaInicial ?? 'No informada'} → {a.LecturaFinal ?? 'No informada'}{a.Origen === 'MigracionSinVerificar' && <p className="text-amber-800">Asignación heredada sin verificación física; no acredita todo el historial anterior.</p>}</div>)}
      {!detail.asignaciones.length && <p>Sin instalaciones registradas.</p>}
      <h3 className="font-semibold">Cronología</h3>
      <ol className="space-y-3">{detail.eventos.map(e => <li key={e.idEvento} className="border-l-4 border-blue-200 pl-3"><strong>{e.MotivoAccion === 'Reemplazar' ? `${meterActions[e.Accion] || e.Accion} por reemplazo` : meterActions[e.Accion] || e.Accion}</strong> · {new Date(e.FechaUtc).toLocaleString('es-AR')}<p>{e.Motivo} · {e.Responsable || 'Migración del sistema'}</p><p>{e.Detalle}</p>{e.OtroMedidorId && <button className="text-blue-700 underline" onClick={() => openDetail(e.OtroMedidorId)}>Ver el otro equipo del reemplazo: {e.OtroMedidorNumero}</button>}<CambiosEvento evento={e} />{e.ReferenciaTrabajo && <p>Trabajo: {e.ReferenciaTrabajo}</p>}</li>)}</ol>
    </section>}
    {admin && <details className="card"><summary className="font-semibold cursor-pointer">Configurar motivos de movimientos</summary><p className="text-sm text-gray-600 my-3">Cargá los motivos que se utilizarán. Las opciones se desactivan sin borrar movimientos anteriores.</p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); saveReason(motivo) }}><label>Acción<select className="input-field" value={motivo.Accion} onChange={e => setMotivo(m => ({ ...m, Accion: e.target.value }))}>{Object.entries(meterActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Motivo<input required maxLength={100} className="input-field" value={motivo.Nombre} onChange={e => setMotivo(m => ({ ...m, Nombre: e.target.value }))} /></label><button className="btn-primary" disabled={busy}>Agregar motivo</button></form>
      <ul className="mt-4 space-y-2">{catalog.motivos.map(m => <li key={m.idMotivo} className="flex justify-between gap-3 border-t pt-2"><span>{meterActions[m.Accion]} · {m.Nombre} · {m.Activo ? 'Activo' : 'Inactivo'}</span><button disabled={busy} className="text-blue-700 underline" onClick={() => saveReason({ ...m, Activo: !m.Activo })}>{m.Activo ? 'Desactivar' : 'Activar'}</button></li>)}</ul>
    </details>}
    {form && <dialog ref={dialog} className="p-6 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto backdrop:bg-black/40" aria-labelledby="meter-form-title" onCancel={e => { if (busy) e.preventDefault(); else setForm(null) }}><form onSubmit={save} className="space-y-4"><h2 id="meter-form-title" className="text-xl font-bold">{meterActions[form.Accion]} {form.label}</h2><fieldset disabled={busy} className="space-y-3">
      {['Alta', 'Verificar', 'Editar'].includes(form.Accion) && <>
        <label className="block">Número que figura en el medidor<input autoFocus required maxLength={50} className="input-field" value={form.Numero} onChange={e => field('Numero', e.target.value)} /></label>
        <label className="block">Tipo<select required className="input-field" value={form.idTipoMedidor} onChange={e => field('idTipoMedidor', e.target.value)}><option value="">Seleccionar</option>{catalog.tipos.filter(t => /agua|el[eé]ctrico/i.test(t.Nombre)).map(t => <option key={t.idTipoMedidor} value={t.idTipoMedidor}>{t.Nombre}</option>)}</select></label>
        {['Marca', 'Modelo'].map(key => <label className="block" key={key}>{key} (si se conoce)<input className="input-field" maxLength={100} value={form[key]} onChange={e => field(key, e.target.value)} /></label>)}
      </>}
      {['Verificar', 'Revision'].includes(form.Accion) && <label className="block">Condición física resultante<select required className="input-field" value={form.EstadoFisico} onChange={e => field('EstadoFisico', e.target.value)}><option value="">Seleccionar</option>{['Operativo', 'PendienteRevision', 'Averiado'].map(k => <option key={k} value={k}>{physicalStates[k]}</option>)}</select></label>}
      <label className="block">Motivo<select required className="input-field" value={form.idMotivo} onChange={e => field('idMotivo', e.target.value)}><option value="">Seleccionar</option>{catalog.motivos.filter(m => m.Activo && m.Accion === form.Accion).map(m => <option key={m.idMotivo} value={m.idMotivo}>{m.Nombre}</option>)}</select></label>
      {!catalog.motivos.some(m => m.Activo && m.Accion === form.Accion) && <p className="text-amber-800">Administración debe configurar un motivo para esta acción antes de guardarla.</p>}
      <label className="block">Fecha y hora del evento (vacío: ahora)<input type="datetime-local" className="input-field" value={form.Fecha} onChange={e => field('Fecha', e.target.value)} /></label>
      <label className="block">Detalle<textarea maxLength={1000} className="input-field" value={form.Detalle} onChange={e => field('Detalle', e.target.value)} /></label>
      <label className="block">Referencia de trabajo (opcional)<input maxLength={100} className="input-field" value={form.ReferenciaTrabajo} onChange={e => field('ReferenciaTrabajo', e.target.value)} /></label>
      {form.Accion === 'BajaDefinitiva' && <p className="text-red-800">La baja definitiva impide volver a instalar este medidor. Su historial se conserva.</p>}
    </fieldset>{formError && <p role="alert" className="text-red-800">{formError}</p>}<div className="flex justify-end gap-3"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setForm(null)}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar movimiento'}</button></div></form></dialog>}
  </div>
}

function CambiosEvento({ evento }) {
  if (!['Editar', 'Verificar'].includes(evento.Accion)) return null
  try {
    const antes = JSON.parse(evento.Anterior || '{}') || {}
    const despues = JSON.parse(evento.Nuevo || '{}') || {}
    const campos = [['Numero', 'Número'], ['Tipo', 'Tipo'], ['Marca', 'Marca'], ['Modelo', 'Modelo'], ['EstadoFisico', 'Condición']]
    return <ul className="text-sm text-gray-600">{campos.filter(([key]) => antes[key] !== despues[key]).map(([key, label]) => <li key={key}>{label}: {physicalStates[antes[key]] || antes[key] || 'Sin informar'} → {physicalStates[despues[key]] || despues[key] || 'Sin informar'}</li>)}</ul>
  } catch { return null }
}
