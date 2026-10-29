import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ClipboardCheck, FileText, Loader2, Pencil, Plus, Power, RefreshCw, Search, X } from 'lucide-react'
import { apiLaboralExistente } from '@/utils/laboral.js'
import { confirmAction, showInfo, showToast } from '@/utils/alerts.js'
import { cleanText, validateServiceName, validateMeaningfulText, FIELD_LIMITS } from '@/utils/validation.js'

const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function ServicioRequisitosPanel({ service }) {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [revision, setRevision] = useState(0), [search, setSearch] = useState(''), [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null), [busy, setBusy] = useState(false)
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('')
    apiLaboralExistente('/requisitoservicio?incluirInactivos=true', { signal: abort.signal })
      .then((data) => { if (!abort.signal.aborted) setRows(data.filter((row) => String(row.idServicio) === String(service.idServicio))) })
      .catch((requestError) => { if (!abort.signal.aborted) setError(requestError.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [service.idServicio, revision])

  const filtered = rows.filter((row) => normalize(`${row.Nombre} ${row.Descripcion}`).includes(normalize(search)))
  const pages = Math.max(1, Math.ceil(filtered.length / 6)), current = Math.min(page, pages)
  const activeCount = rows.filter((row) => row.Activo).length

  async function toggle(row) {
    if (busy) return
    setBusy(true)
    try {
      const accepted = await confirmAction({
        title: row.Activo ? '¿Desactivar este requisito?' : '¿Activar este requisito?',
        message: row.Activo ? `“${row.Nombre}” dejará de solicitarse en nuevos pedidos de ${service.Nombre}. El historial se conservará.` : `“${row.Nombre}” volverá a estar disponible en los pedidos de ${service.Nombre}.`,
        confirmButtonText: row.Activo ? 'Desactivar' : 'Activar', type: 'warning'
      })
      if (!accepted) return
      await apiLaboralExistente(`/requisitoservicio/estado/${row.idRequisitoServicio}`, { method: 'PUT' })
      setRevision((value) => value + 1)
      showToast({ title: row.Activo ? 'Requisito desactivado' : 'Requisito activado', type: 'success' })
    } catch (requestError) { await showInfo({ title: 'No se pudo cambiar el estado', message: requestError.message, type: 'error' }) }
    finally { setBusy(false) }
  }

  return <section className="service-requirements">
    <header><span className="service-requirements-icon"><ClipboardCheck size={27} /></span><div><small>DOCUMENTACIÓN DEL SERVICIO</small><h2>Requisitos de {service.Nombre}</h2><p>Configurá lo que deberá presentar el socio al solicitar este servicio.</p></div><button type="button" className="btn-primary" disabled={busy || loading} onClick={() => setEditing({ Nombre: '', Descripcion: '', Obligatorio: true })}><Plus size={16} />Nuevo requisito</button></header>
    {!loading && !error && <div className="service-requirements-summary"><span><FileText size={15} /><strong>{rows.length}</strong> totales</span><span><CheckCircle2 size={15} /><strong>{activeCount}</strong> activos</span><span><ClipboardCheck size={15} /><strong>{rows.filter((row) => row.Obligatorio).length}</strong> obligatorios</span></div>}
    <div className="service-requirements-tools"><label><Search size={17} /><input value={search} maxLength={100} placeholder="Buscar requisito…" aria-label="Buscar requisitos del servicio" onChange={(event) => { setSearch(event.target.value); setPage(1) }} />{search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}><X size={14} /></button>}</label><button type="button" className="btn-secondary" disabled={loading || busy} aria-label="Actualizar requisitos" onClick={() => setRevision((value) => value + 1)}><RefreshCw size={16} /></button></div>
    {loading ? <p className="service-requirements-empty" role="status"><Loader2 size={23} className="animate-spin" />Cargando requisitos…</p> : error ? <div className="service-requirements-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Reintentar</button></div> : <>
      <div className="service-requirements-list">{filtered.slice((current - 1) * 6, current * 6).map((row) => <article key={row.idRequisitoServicio}><div className="service-requirement-copy"><span className="service-requirement-file"><FileText size={18} /></span><div><h3>{row.Nombre}</h3><p>{row.Descripcion}</p><div className="service-requirement-badges"><span className={row.Activo ? 'is-active' : ''}>{row.Activo ? 'Activo' : 'Inactivo'}</span><span className={row.Obligatorio ? 'is-required' : ''}>{row.Obligatorio ? 'Obligatorio' : 'Opcional'}</span></div></div></div><div className="service-requirement-actions"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setEditing(row)}><Pencil size={14} />Editar</button><button type="button" className="btn-secondary" disabled={busy} onClick={() => toggle(row)}><Power size={14} />{row.Activo ? 'Desactivar' : 'Activar'}</button></div></article>)}</div>
      {!filtered.length && <p className="service-requirements-empty">{search ? 'No hay requisitos que coincidan con esta búsqueda.' : 'Este servicio todavía no tiene requisitos configurados.'}</p>}
      {filtered.length > 0 && <nav className="service-requirements-pagination" aria-label="Páginas de requisitos"><span>{filtered.length} requisitos · Página {current} de {pages}</span><div><button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</button><button type="button" disabled={current === pages} onClick={() => setPage(current + 1)}>Siguiente</button></div></nav>}
    </>}
    {editing && <RequirementDialog requirement={editing} service={service} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setRevision((value) => value + 1) }} />}
  </section>
}

function RequirementDialog({ requirement, service, onClose, onSaved }) {
  const ref = useRef(null), [name, setName] = useState(requirement.Nombre || ''), [description, setDescription] = useState(requirement.Descripcion || '')
  const [required, setRequired] = useState(requirement.Obligatorio ?? true), [busy, setBusy] = useState(false), [error, setError] = useState('')
  useEffect(() => { const modal = ref.current; modal.showModal(); return () => modal.close() }, [])
  async function save(event) {
    event.preventDefault(); if (busy) return
    const invalid = validateServiceName(name, 'El nombre del requisito') || validateMeaningfulText(description, 'La descripción', FIELD_LIMITS.description)
    if (invalid) { setError(invalid); return }
    setBusy(true); setError('')
    try {
      await apiLaboralExistente(`/requisitoservicio${requirement.idRequisitoServicio ? `/${requirement.idRequisitoServicio}` : ''}`, { method: requirement.idRequisitoServicio ? 'PUT' : 'POST', body: { idServicio: service.idServicio, Nombre: cleanText(name), Descripcion: cleanText(description), Obligatorio: required } })
      showToast({ title: requirement.idRequisitoServicio ? 'Requisito actualizado' : 'Requisito creado', type: 'success' }); onSaved()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return <dialog ref={ref} className="service-requirement-dialog" aria-labelledby="requirement-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}><form onSubmit={save}><header><div><small>{service.Nombre}</small><h2 id="requirement-dialog-title">{requirement.idRequisitoServicio ? 'Editar requisito' : 'Nuevo requisito'}</h2></div><button type="button" disabled={busy} aria-label="Cerrar requisito" onClick={onClose}><X size={20} /></button></header><fieldset disabled={busy}><label>Nombre<input autoFocus required minLength={FIELD_LIMITS.serviceName.min} maxLength={FIELD_LIMITS.serviceName.max} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Descripción para el socio<textarea required minLength={FIELD_LIMITS.description.min} maxLength={FIELD_LIMITS.description.max} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explicá qué debe presentar y qué debe verse en el archivo." /></label><label className="service-requirement-checkbox"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />Es obligatorio para solicitar este servicio</label>{error && <p className="service-requirements-error" role="alert">{error}</p>}</fieldset><footer><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar requisito'}</button></footer></form></dialog>
}
