import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleDollarSign, ClipboardCheck, Droplet, Layers3, Pencil, PlusCircle, Search, Trash2, Wifi, Wrench, X, Zap } from 'lucide-react'
import { useServicios } from '@/hooks/useServicios.js'
import { confirmAction, showToast } from '@/utils/alerts.js'
import { cleanText, FIELD_LIMITS, firstValidationError, isPositiveNumber, validateMeaningfulText, validateServiceName } from '@/utils/validation.js'
import ServicioRequisitosPanel from './ServicioRequisitosPanel.jsx'
import './ServicioRequisitos.css'

const initialForm = { idServicio: null, nombre: '', descripcion: '', idTipoTarifa: '', tarifaBase: '' }
const getIcon = (name = '') => { const n = name.toLowerCase(); return n.includes('agua') ? Droplet : n.includes('luz') || n.includes('energ') ? Zap : n.includes('internet') || n.includes('wifi') ? Wifi : Wrench }
const money = (value) => (Number(value) || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })

function ServiceDialog({ open, onClose, form, onChange, onSubmit, tipos, loading, saving, error, mode }) {
  useEffect(() => {
    if (!open) return undefined
    const overflow = document.body.style.overflow
    const escape = (event) => event.key === 'Escape' && !saving && onClose()
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', escape) }
  }, [open, saving, onClose])
  if (!open) return null
  return <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
    <div className="service-form-modal" role="dialog" aria-modal="true" aria-labelledby="service-form-title">
      <header className="service-form-modal__header">
        <span className="service-form-modal__icon"><Wrench size={22} /></span>
        <div><small>{mode === 'edit' ? 'EDITAR CATÁLOGO' : 'NUEVO EN EL CATÁLOGO'}</small><h2 id="service-form-title">{mode === 'edit' ? 'Modificar servicio' : 'Nuevo servicio'}</h2><p>{mode === 'edit' ? 'Actualizá los datos comerciales del servicio.' : 'Completá los datos y asignale un tipo de tarifa.'}</p></div>
        <button type="button" onClick={onClose} disabled={saving} className="service-form-modal__close" aria-label="Cerrar ventana"><X size={20} /></button>
      </header>
      <form onSubmit={onSubmit} className="service-form-modal__body">
        <label htmlFor="service-name">Nombre del servicio</label>
        <input id="service-name" name="nombre" value={form.nombre} onChange={onChange} minLength={FIELD_LIMITS.serviceName.min} maxLength={FIELD_LIMITS.serviceName.max} className="input-field" placeholder="Ej. Recolección de residuos" autoFocus required />
        <label htmlFor="service-description">Descripción</label>
        <textarea id="service-description" name="descripcion" value={form.descripcion} onChange={onChange} minLength={FIELD_LIMITS.description.min} maxLength={FIELD_LIMITS.description.max} className="input-field" placeholder="Explicá brevemente qué incluye el servicio" rows={3} required />
        <div className="service-form-modal__columns">
          <div><label htmlFor="service-rate-type">Tipo de tarifa</label><select id="service-rate-type" name="idTipoTarifa" value={form.idTipoTarifa} onChange={onChange} className="input-field" required disabled={loading}><option value="">{loading ? 'Cargando tipos de tarifa…' : 'Seleccioná un tipo'}</option>{tipos.map((type) => <option key={type.idTipoTarifa} value={type.idTipoTarifa}>{type.NombreTipo}</option>)}</select></div>
          <div><label htmlFor="service-rate">Tarifa base</label><div className="service-money-input"><span>$</span><input id="service-rate" name="tarifaBase" type="number" min="0" step="0.01" value={form.tarifaBase} onChange={onChange} placeholder="0,00" required /></div></div>
        </div>
        {error && <div className="service-form-error" role="alert">{error}</div>}
        <footer className="service-form-modal__footer"><button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button><button className="btn-primary" disabled={saving || loading}>{saving ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Crear servicio'}</button></footer>
      </form>
    </div>
  </div>
}

export default function AdminServicios() {
  const { servicios, loadingServicios, tiposTarifa, loadingTiposTarifa, fetchTiposTarifa, crearServicio, editarServicio, eliminarServicio } = useServicios(true)
  const [search, setSearch] = useState(''), [modalOpen, setModalOpen] = useState(false), [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm), [formError, setFormError] = useState(''), [modalMode, setModalMode] = useState('create')
  const [deletingId, setDeletingId] = useState(null), [requirementsId, setRequirementsId] = useState(null), [requirementsOpen, setRequirementsOpen] = useState(false)
  const requirementsService = servicios.find((item) => String(item.idServicio) === String(requirementsId))

  useEffect(() => { if (modalOpen && !tiposTarifa.length) fetchTiposTarifa() }, [modalOpen, tiposTarifa.length, fetchTiposTarifa])
  useEffect(() => {
    if (!requirementsOpen) return undefined
    const overflow = document.body.style.overflow, escape = (event) => event.key === 'Escape' && setRequirementsOpen(false)
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', escape) }
  }, [requirementsOpen])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return servicios.filter((item) => [item.Nombre, item.nombre, item.Descripcion, item.descripcion, item.TipoTarifa, item.tipoTarifa].some((value) => String(value || '').toLocaleLowerCase('es').includes(query)))
  }, [servicios, search])

  const openCreate = async () => { setModalMode('create'); setForm(initialForm); setFormError(''); setModalOpen(true); if (!tiposTarifa.length) await fetchTiposTarifa() }
  const openEdit = async (item) => {
    setModalMode('edit'); setFormError(''); setForm({ idServicio: item.idServicio, nombre: item.Nombre || item.nombre || '', descripcion: item.Descripcion || item.descripcion || '', idTipoTarifa: String(item.idTipoTarifa || ''), tarifaBase: String(item.TarifaBase ?? item.tarifaBase ?? '') }); setModalOpen(true)
    if (!tiposTarifa.length) await fetchTiposTarifa()
  }
  const closeDialog = () => { if (!saving) { setModalOpen(false); setFormError(''); setForm(initialForm) } }
  const submit = async (event) => {
    event.preventDefault()
    const invalid = firstValidationError([validateServiceName(form.nombre, 'El nombre del servicio'), validateMeaningfulText(form.descripcion, 'La descripción', FIELD_LIMITS.description), !isPositiveNumber(form.idTipoTarifa) ? 'Seleccioná un tipo de tarifa válido.' : '', !isPositiveNumber(form.tarifaBase) ? 'La tarifa base debe ser mayor a cero.' : ''])
    if (invalid) { setFormError(invalid); return }
    setSaving(true); setFormError('')
    try {
      const payload = { Nombre: cleanText(form.nombre), Descripcion: cleanText(form.descripcion), idTipoTarifa: Number(form.idTipoTarifa), TarifaBase: Number(form.tarifaBase) }
      if (modalMode === 'edit') await editarServicio(form.idServicio, payload); else await crearServicio(payload)
      setModalOpen(false); setForm(initialForm); showToast({ title: modalMode === 'edit' ? 'Servicio actualizado' : 'Servicio creado', type: 'success' })
    } catch (error) { console.error('Error al guardar servicio', error); setFormError('No se pudo guardar el servicio. Revisá los datos e intentá nuevamente.') }
    finally { setSaving(false) }
  }
  const remove = async (item) => {
    if (!await confirmAction({ title: '¿Eliminar servicio?', message: `Se eliminará “${item.Nombre || item.nombre}” del catálogo. Esta acción puede afectar solicitudes relacionadas.`, confirmButtonText: 'Eliminar', type: 'warning', danger: true })) return
    setDeletingId(item.idServicio)
    try { await eliminarServicio(item.idServicio); showToast({ title: 'Servicio eliminado', message: 'El servicio se eliminó correctamente.', type: 'success' }) }
    catch (error) { console.error('Error al eliminar servicio', error); showToast({ title: 'No se pudo eliminar', message: 'Revisá si el servicio tiene solicitudes relacionadas.', type: 'error' }) }
    finally { setDeletingId(null) }
  }
  const view = filtered.map((item) => ({ id: item.idServicio, raw: item, nombre: item.Nombre || item.nombre || 'Servicio sin nombre', descripcion: item.Descripcion || item.descripcion || 'Sin descripción', tipo: item.TipoTarifa || item.tipoTarifa || 'Tarifa sin categoría', tarifa: item.TarifaBase ?? item.tarifaBase ?? 0 }))

  return <>
    <main className="service-catalog">
      <section className="service-hero"><div className="service-hero__copy"><span className="service-eyebrow"><Layers3 size={14} /> CONFIGURACIÓN GENERAL</span><h1>Servicios y requisitos</h1><p>Administrá el catálogo, las tarifas y la documentación que debe presentar cada socio.</p></div><button type="button" onClick={openCreate} className="service-primary-action"><PlusCircle size={20} />Nuevo servicio</button></section>
      <section className="service-summary" aria-label="Resumen del catálogo"><article><span><Layers3 size={20} /></span><div><strong>{servicios.length}</strong><p>Servicios configurados</p></div></article><article><span><CheckCircle2 size={20} /></span><div><strong>{servicios.length}</strong><p>Disponibles para socios</p></div></article><article><span><CircleDollarSign size={20} /></span><div><strong>{tiposTarifa.length || '—'}</strong><p>Tipos de tarifa</p></div></article></section>
      <section className="service-list-panel">
        <header className="service-list-panel__heading"><div><h2>Catálogo de servicios</h2><p>Elegí un servicio para editarlo o gestionar sus requisitos.</p></div><label className="service-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, descripción o tarifa…" aria-label="Buscar servicios" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda"><X size={15} /></button>}</label></header>
        <div className="service-grid">
          {loadingServicios && Array.from({ length: 3 }).map((_, index) => <div className="service-card service-card--loading" key={index}><span /><span /><span /></div>)}
          {!loadingServicios && view.map((item) => { const Icon = getIcon(item.nombre); return <article className="service-card" key={item.id}><div className="service-card__top"><span className="service-card__icon"><Icon size={25} /></span><span className="service-status"><i />Disponible</span></div><div className="service-card__content"><h3>{item.nombre}</h3><p>{item.descripcion}</p></div><div className="service-card__rate"><span>{item.tipo}</span><strong>{money(item.tarifa)}</strong></div><div className="service-card__actions"><button type="button" className="service-requirements-button" aria-haspopup="dialog" onClick={() => { setRequirementsId(item.id); setRequirementsOpen(true) }}><ClipboardCheck size={17} />Gestionar requisitos<ArrowRight size={16} /></button><div><button type="button" onClick={() => openEdit(item.raw)} className="service-icon-button" aria-label={`Modificar ${item.nombre}`} title="Modificar servicio"><Pencil size={17} /></button><button type="button" onClick={() => remove(item.raw)} disabled={deletingId === item.id} className="service-icon-button service-icon-button--danger" aria-label={`Eliminar ${item.nombre}`} title="Eliminar servicio"><Trash2 size={17} /></button></div></div></article> })}
        </div>
        {!loadingServicios && !view.length && <div className="service-empty"><Search size={27} /><h3>No encontramos servicios</h3><p>Probá con otro término o limpiá la búsqueda.</p>{search && <button type="button" onClick={() => setSearch('')}>Ver todos</button>}</div>}
      </section>
    </main>
    <ServiceDialog open={modalOpen} onClose={closeDialog} form={form} onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))} onSubmit={submit} tipos={tiposTarifa} loading={loadingTiposTarifa} saving={saving} error={formError} mode={modalMode} />
    {requirementsOpen && requirementsService && <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setRequirementsOpen(false)}><div className="service-requirements-modal" role="dialog" aria-modal="true" aria-label={`Requisitos de ${requirementsService.Nombre}`}><button className="service-requirements-modal__close" type="button" onClick={() => setRequirementsOpen(false)} aria-label="Cerrar requisitos"><X size={20} /></button><ServicioRequisitosPanel key={requirementsService.idServicio} service={requirementsService} /></div></div>}
  </>
}
