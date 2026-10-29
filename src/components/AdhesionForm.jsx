import React from 'react'
import { Check, FileText, HeartHandshake, Plus, Stethoscope, Trash2, Users } from 'lucide-react'
import { nuevoBeneficiario } from '@/utils/adhesiones.js'

const money = amount => Number(amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export default function AdhesionForm({ value, onChange, servicios = [], correccion = false }) {
  const set = patch => onChange({ ...value, ...patch })
  const familiar = (index, patch) => set({ Familiares: value.Familiares.map((f, i) => i === index ? { ...f, ...patch } : f) })
  const choices = [
    { field: 'Sepelio', tipo: 'SEPELIO', icon: HeartHandshake, text: 'Elegí a quiénes cubrir y adjuntá el DNI de cada persona.' },
    { field: 'Ortopedia', tipo: 'ORTOPEDIA', icon: Stethoscope, text: 'Adhesión simple, sin documentación adicional.' }
  ]
  return <fieldset className="benefit-form">
    <legend className="sr-only">Elegir servicios adicionales</legend>
    <div className="benefit-section-heading"><span><HeartHandshake size={20} /></span><div><h3>Elegí tu cobertura</h3><p>Podés seleccionar uno o ambos servicios.</p></div></div>
    {!correccion && <div className="benefit-choice-grid">{choices.map(({ field, tipo, icon: Icon, text }) => {
      const servicio = servicios.find(s => s.Tipo === tipo); const enabled = Boolean(servicio && Number(servicio.TarifaBase) > 0); const selected = value[field]
      return <label key={tipo} className={`benefit-choice ${selected ? 'is-selected' : ''} ${!enabled ? 'is-disabled' : ''}`}><input type="checkbox" checked={selected} disabled={!enabled} onChange={e => set({ [field]: e.target.checked })} /><span className="benefit-choice-icon"><Icon size={24} /></span><span className="benefit-choice-copy"><b>{field}</b><small>{enabled ? `${money(servicio.TarifaBase)} por mes` : 'Pendiente de configuración'}</small><span>{text}</span></span><span className="benefit-choice-check"><Check size={15} /></span></label>
    })}</div>}
    {value.Sepelio && <div className="benefit-people">
      <div className="benefit-section-heading"><span><Users size={20} /></span><div><h3>Personas incluidas</h3><p>Adjuntá un DNI por persona (hasta 2 MB cada uno y 6 MB en total).</p></div></div>
      <p className="benefit-help">Podés incluir al titular, familiares o ambos. Los hijos que viven fuera de la localidad pueden conservar la adhesión, sujeto a verificación.</p>
      <div className="benefit-person-list">{value.Familiares.map((f, i) => <fieldset key={f.idBeneficiario || f.clave} className="benefit-person-card"><legend><span>{i + 1}</span> Persona {i + 1}</legend><div className="grid gap-3 sm:grid-cols-3"><label>Nombre y apellido<input className="input-field" required maxLength={150} value={f.Nombre} onChange={e => familiar(i, { Nombre: e.target.value })} /></label><label>DNI<input className="input-field" required inputMode="numeric" maxLength={20} value={f.Documento} onChange={e => familiar(i, { Documento: e.target.value })} /></label><label>Vínculo<input className="input-field" required maxLength={60} placeholder="Titular, hijo/a, cónyuge…" value={f.Vinculo} onChange={e => familiar(i, { Vinculo: e.target.value })} /></label></div><label className="benefit-file"><FileText size={19} /><span><b>Copia del DNI</b><small>PDF, PNG o JPEG</small></span><input type="file" accept="application/pdf,image/png,image/jpeg" required onChange={e => familiar(i, { archivo: e.target.files?.[0] || null })} /></label><label className="benefit-check"><input type="checkbox" checked={f.MismoDomicilio} onChange={e => familiar(i, { MismoDomicilio: e.target.checked, ConservaAdhesion: false })} /><span>Vive en el domicilio de la adhesión</span></label>{!f.MismoDomicilio && <label className="benefit-check is-warning"><input type="checkbox" checked={Boolean(f.ConservaAdhesion)} onChange={e => familiar(i, { ConservaAdhesion: e.target.checked })} /><span>Es hijo/a fuera de la localidad y mantiene la adhesión familiar</span></label>}{value.Familiares.length > 1 && <button type="button" className="benefit-remove" onClick={() => set({ Familiares: value.Familiares.filter((_, j) => j !== i) })}><Trash2 size={15} /> Quitar persona</button>}</fieldset>)}</div>
      <button type="button" className="btn-secondary benefit-add" disabled={value.Familiares.length >= 15} onClick={() => set({ Familiares: [...value.Familiares, nuevoBeneficiario()] })}><Plus size={18} /> Agregar otra persona</button>
    </div>}
    {!correccion && (value.Sepelio || value.Ortopedia) && <label className="benefit-consent"><input type="checkbox" required checked={value.Consentimiento} onChange={e => set({ Consentimiento: e.target.checked })} /><span><b>Confirmo la solicitud y los cargos mensuales</b><small>Para Sepelio, autorizo el uso de los datos y DNI del grupo familiar para gestionar la cobertura con el prestador.</small></span></label>}
  </fieldset>
}
