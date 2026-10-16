import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { meterApi, meterActions, physicalStates } from '@/utils/meters.js'
import { esEncargado } from '@/utils/laboralPermissions.js'
import { normalizeRole } from '@/utils/auth.js'
import { Gauge, ShieldCheck } from 'lucide-react'
import MedidoresListado from './MedidoresListado.jsx'
import MedidorFicha from './MedidorFicha.jsx'
import FallaMedidorDialog from './FallaMedidorDialog.jsx'
import { showInfo, showToast, confirmAction } from '@/utils/alerts.js'
import './Medidores.css'
import { laboralApi } from '@/utils/laboral.js'

export default function AdminInventarioMedidores() {
  const admin = normalizeRole(useAuthStore(s => s.rol)) === 'Administrador'
  const areas = useAuthStore(s => s.areas)
  const canManageTechnical = meter => esEncargado(areas, meter.Tipo === 'Agua' ? 'AGUA' : 'ENERGIA')
  const [params] = useSearchParams()
  const [view, setView] = useState('Disponibles')
  const [rows, setRows] = useState({ items: [], total: 0 })
  const [catalog, setCatalog] = useState({ tipos: [], motivos: [] })
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [detail, setDetail] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState('')
  const dialog = useRef(null)
  const detailSection = useRef(null)
  const listSection = useRef(null)
  const detailRequest = useRef(0)
  useEffect(() => () => { detailRequest.current++ }, [])
  useEffect(() => { if (notice) { showToast({ title: 'Movimiento registrado', message: notice, type: 'success', target: detailSection.current || undefined }); setNotice('') } }, [notice])
  useEffect(() => { if (formError) showInfo({ title: 'Revisá el movimiento', message: formError, type: 'error', target: dialog.current || undefined }) }, [formError])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError('')
    const timer = setTimeout(() => Promise.all([meterApi(`?estado=${view}&pagina=${page}&q=${encodeURIComponent(q)}`, { signal: abort.signal }), meterApi('/catalogos', { signal: abort.signal })])
      .then(([list, cats]) => { if (!abort.signal.aborted) { const last = Math.max(1, Math.ceil(list.total / 25)); if (page > last) { setPage(last); return } setRows(list); setCatalog(cats) } })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) }), 250)
    return () => { clearTimeout(timer); abort.abort() }
  }, [page, q, revision, view])
  useEffect(() => {
    if (form && form.Accion !== 'Falla' && !dialog.current?.open) dialog.current?.showModal()
  }, [form])
  useEffect(() => { const id = Number(params.get('medidor')); if (id > 0) openDetail(id) }, [params])
  async function openDetail(id) {
    const requestId = ++detailRequest.current
    setOpeningId(id)
    try { const data = await meterApi(`/${id}`); if (requestId === detailRequest.current) { setDetail(data); return data } }
    catch (failure) { if (requestId === detailRequest.current) showInfo({ title: 'No se pudo abrir la ficha', message: failure.message, type: 'error', target: detailSection.current || undefined }) }
    finally { if (requestId === detailRequest.current) setOpeningId(null) }
  }
  function openAction(Accion, meter = null) {
    const confirmRepair = Accion === 'ConfirmarReparacion'
    if (confirmRepair) Accion = 'Revision'
    setFormError('')
    setForm({ Accion, idMedidor: meter?.idMedidor, Numero: meter?.IdentidadVerificada ? meter.Numero : '', Marca: meter?.Marca || '', Modelo: meter?.Modelo || '',
      idTipoMedidor: meter?.idTipoMedidor || '', Version: meter?.Version || null, idMotivo: '', Detalle: '', ReferenciaTrabajo: '',
      EstadoFisico: confirmRepair ? 'Operativo' : '', idServicioSocio: '', Lectura: '', Fecha: '', label: meter?.Numero || '' })
  }
  async function createIncidentTask(incident) {
    if (busy) return
    setBusy(true)
    try {
      if (!await confirmAction({ title: 'Crear tarea para atender la falla', message: 'Se creará un trabajo vinculado a esta incidencia y al medidor. Luego podrás elegir al operario responsable desde la tarea.', confirmButtonText: 'Crear tarea', target: detailSection.current })) return
      const created = await laboralApi(`/incidencias-medidor/${incident.idIncidencia}/tarea`, { method: 'POST' })
      await openDetail(detail.ficha.idMedidor)
      setNotice(created.existente ? 'La incidencia ya tenía una tarea abierta. Usá «Ver tarea» para continuar.' : 'Tarea creada. Abrí «Ver tarea» para asignar al responsable.')
    } catch (failure) { await showInfo({ title: 'No se pudo crear la tarea', message: failure.message, type: 'error', target: detailSection.current || undefined }) }
    finally { setBusy(false) }
  }
  async function save(event) {
    event.preventDefault(); if (busy) return
    if (form.Accion === 'Falla' && !catalog.motivos.some(item => item.Activo && item.Accion === 'Falla' && String(item.idMotivo) === String(form.idMotivo))) { setFormError('Seleccioná un motivo de falla activo antes de continuar.'); return }
    setBusy(true); setFormError(''); setNotice('')
    try {
      const confirmed = await confirmAction({ title: meterActions[form.Accion], message: form.Accion === 'BajaDefinitiva' ? `El medidor ${form.label} no podrá volver a instalarse. Su historial se conservará.` : form.Accion === 'Falla' ? `Se registrará la falla «${catalog.motivos.find(item => String(item.idMotivo) === String(form.idMotivo))?.Nombre || ''}» en el medidor ${form.label}. Quedará marcado como averiado y se conservarán su historial y asignación actual.` : form.Accion === 'Revision' && form.EstadoFisico === 'Operativo' ? `Se confirmará que el medidor ${form.label} está operativo y se cerrará su incidencia abierta.` : `Se registrará este movimiento para el medidor ${form.Numero || form.label}, con fecha y responsable.`, confirmButtonText: form.Accion === 'Falla' ? 'Confirmar falla' : 'Confirmar movimiento', cancelButtonText: 'Volver al formulario', danger: form.Accion === 'BajaDefinitiva', type: ['BajaDefinitiva', 'Falla'].includes(form.Accion) ? 'warning' : 'question', target: dialog.current })
      if (!confirmed) return
      const payload = { ...form, idMotivo: form.idMotivo ? Number(form.idMotivo) : null, idTipoMedidor: Number(form.idTipoMedidor),
        idServicioSocio: form.idServicioSocio ? Number(form.idServicioSocio) : null, Lectura: form.Lectura === '' ? null : Number(form.Lectura),
        Fecha: form.Fecha ? new Date(form.Fecha).toISOString() : null }
      const updated = await meterApi(form.idMedidor ? `/${form.idMedidor}/eventos` : '', { method: 'POST', body: JSON.stringify(payload) })
      setForm(null); setRevision(r => r + 1); await openDetail(updated.idMedidor); setNotice(form.Accion === 'Falla' ? 'Falla registrada. En «Seguimiento de la falla» podés crear la tarea para atenderla.' : form.Accion === 'Reparacion' ? 'Envío a reparación registrado. La incidencia sigue abierta hasta confirmar la solución.' : 'Movimiento guardado con su historial.')
    } catch (e) { setFormError(e.message) } finally { setBusy(false) }
  }
  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))
  return <div className="meter-inventory space-y-6">
    <header className="meter-inventory-hero"><div><span><Gauge size={17}/> EQUIPOS Y CONEXIONES</span><h1>Medidores</h1><p>Encontrá un equipo, consultá su estado y seguí su historial.</p><small><ShieldCheck size={15}/>Las instalaciones, reemplazos y retiros se registran desde las tareas del área.</small></div><Gauge size={60} className="meter-inventory-hero-gauge"/></header>
    <div ref={listSection}><MedidoresListado {...{ admin, view, setView, rows, q, setQ, page, setPage, loading, error, openAction, openDetail, openingId }} refresh={() => setRevision(value => value + 1)}/></div>
    {detail && <MedidorFicha suspended={Boolean(form)} key={detail.ficha.idMedidor} detail={detail} sectionRef={detailSection} {...{admin, canManageTechnical, busy, openingId}} onAction={openAction} onOpen={openDetail} onCreateTask={createIncidentTask} onClose={() => { detailRequest.current++; setOpeningId(null); setDetail(null);  }}/>}
    {form?.Accion === 'Falla' && <FallaMedidorDialog dialogRef={dialog} form={form} meter={detail?.ficha} motivos={catalog.motivos} busy={busy} field={field} onSubmit={save} onClose={() => setForm(null)}/>}{form && form.Accion !== 'Falla' && <dialog ref={dialog} className="meter-inventory-dialog p-6 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto backdrop:bg-black/40" aria-labelledby="meter-form-title" onCancel={e => { if (busy) e.preventDefault(); else setForm(null) }}><form onSubmit={save} className="space-y-4"><h2 id="meter-form-title" className="text-xl font-bold">{meterActions[form.Accion]} {form.label}</h2><fieldset disabled={busy} className="space-y-3">
      {['Alta', 'Verificar', 'Editar'].includes(form.Accion) && <>
        <label className="block">Número que figura en el medidor<input autoFocus required maxLength={50} className="input-field" value={form.Numero} onChange={e => field('Numero', e.target.value)} /></label>
        <label className="block">Tipo<select required className="input-field" value={form.idTipoMedidor} onChange={e => field('idTipoMedidor', e.target.value)}><option value="">Seleccionar</option>{catalog.tipos.filter(t => /agua|el[eé]ctrico/i.test(t.Nombre)).map(t => <option key={t.idTipoMedidor} value={t.idTipoMedidor}>{t.Nombre}</option>)}</select></label>
        {['Marca', 'Modelo'].map(key => <label className="block" key={key}>{key} (si se conoce)<input className="input-field" maxLength={100} value={form[key]} onChange={e => field(key, e.target.value)} /></label>)}
      </>}
      {['Verificar', 'Revision'].includes(form.Accion) && <label className="block">Condición física resultante<select required className="input-field" value={form.EstadoFisico} onChange={e => field('EstadoFisico', e.target.value)}><option value="">Seleccionar</option>{['Operativo', 'PendienteRevision', 'Averiado'].map(k => <option key={k} value={k}>{physicalStates[k]}</option>)}</select></label>}
      {form.Accion === 'Falla' && <label className="block">Tipo de falla<select required className="input-field" value={form.idMotivo} onChange={e => field('idMotivo', e.target.value)}><option value="">Seleccionar</option>{catalog.motivos.filter(m => m.Activo && m.Accion === 'Falla').map(m => <option key={m.idMotivo} value={m.idMotivo}>{m.Nombre}</option>)}</select></label>}
      <label className="block">Fecha y hora del evento (vacío: ahora)<input type="datetime-local" className="input-field" value={form.Fecha} onChange={e => field('Fecha', e.target.value)} /></label>
      <label className="block">Detalle<textarea maxLength={1000} className="input-field" value={form.Detalle} onChange={e => field('Detalle', e.target.value)} /></label>
      <label className="block">Referencia de trabajo (opcional)<input maxLength={100} className="input-field" value={form.ReferenciaTrabajo} onChange={e => field('ReferenciaTrabajo', e.target.value)} /></label>
      {form.Accion === 'BajaDefinitiva' && <p className="text-red-800">La baja definitiva impide volver a instalar este medidor. Su historial se conserva.</p>}
    </fieldset>{formError && <p role="alert" className="text-red-800">{formError}</p>}<div className="flex justify-end gap-3"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setForm(null)}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar movimiento'}</button></div></form></dialog>}
  </div>
}
