import React, { useState } from 'react'
import { Info, UserPlus, X } from 'lucide-react'
import { useSocios } from '@/hooks/useSocios.js'
import { showInfo, showToast } from '@/utils/alerts.js'
import { firstValidationError, FIELD_LIMITS, isBlank, sanitizePersonPayload, validateAddress, validateDocument, validateEmail, validateHouseNumber, validatePersonName, validatePhone } from '@/utils/validation.js'

const fields = [
  ['Nombre', 'Nombre', 'text'], ['Apellido', 'Apellido', 'text'], ['Documento', 'Documento', 'text'],
  ['Telefono', 'Teléfono', 'tel'], ['Email', 'Correo electrónico', 'email'], ['Calle', 'Calle', 'text'], ['Numero', 'Número', 'text']
]
const initial = { Nombre: '', Apellido: '', Documento: '', Telefono: '', Email: '', Calle: '', Numero: '', EsTitular: '' }
export default function ModalCrearSocio({ show, onClose, onSaved }) {
  const { crearSocio } = useSocios(false)
  const [form, setForm] = useState(initial), [saving, setSaving] = useState(false)
  if (!show) return null
  const close = () => { if (!saving) onClose() }
  const submit = async (event) => {
    event.preventDefault(); const data = sanitizePersonPayload(form)
    const invalid = firstValidationError([validatePersonName(data.Nombre, 'El nombre'), validatePersonName(data.Apellido, 'El apellido'), validateDocument(data.Documento), validatePhone(data.Telefono), validateEmail(data.Email), !isBlank(data.Calle) && validateAddress(data.Calle), !isBlank(data.Numero) && validateHouseNumber(data.Numero), !form.EsTitular ? 'Indicá si el solicitante es titular del domicilio.' : ''])
    if (invalid) { showToast({ title: 'Revisá los datos', message: invalid, type: 'error' }); return }
    setSaving(true)
    try {
      const result = await crearSocio({ ...data, EsTitular: form.EsTitular === 'true' })
      await showInfo({ title: 'Cuenta creada', message: `Usuario: ${result?.usuario ?? form.Documento}\nContraseña temporal: ${result?.passwordTemporal ?? ''}\n\nEl socio deberá ingresar y completar su documentación para aprobar el alta.`, type: 'success' })
      setForm(initial); await onSaved?.(); onClose()
    } catch (error) { showToast({ title: 'No se pudo crear el socio', message: error.message || 'Intentá nuevamente.', type: 'error' }) }
    finally { setSaving(false) }
  }
  return <div className="people-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}><div className="people-form-modal" role="dialog" aria-modal="true" aria-labelledby="new-member-title"><header className="people-form-modal__header"><span><UserPlus size={22} /></span><div><small>NUEVO EN LA COMUNIDAD</small><h2 id="new-member-title">Agregar socio</h2></div><button type="button" className="people-form-close" onClick={close} disabled={saving} aria-label="Cerrar"><X size={19} /></button></header><form className="people-form-body" onSubmit={submit}><div className="people-form-grid">{fields.map(([name, label, type]) => <div className="people-form-field" key={name}><label htmlFor={`socio-${name}`}>{label}</label><input id={`socio-${name}`} className="input-field" type={type} name={name} value={form[name]} onChange={(event) => setForm((value) => ({ ...value, [name]: event.target.value }))} required={['Nombre', 'Apellido', 'Documento'].includes(name)} minLength={FIELD_LIMITS[name === 'Nombre' || name === 'Apellido' ? 'personName' : name === 'Documento' ? 'document' : name === 'Telefono' ? 'phone' : name === 'Email' ? 'email' : name === 'Calle' ? 'address' : 'houseNumber']?.min} maxLength={FIELD_LIMITS[name === 'Nombre' || name === 'Apellido' ? 'personName' : name === 'Documento' ? 'document' : name === 'Telefono' ? 'phone' : name === 'Email' ? 'email' : name === 'Calle' ? 'address' : 'houseNumber']?.max} /></div>)}</div><div className="people-form-field mt-4"><label htmlFor="socio-titular">¿Es titular del domicilio?</label><select id="socio-titular" name="EsTitular" value={form.EsTitular} onChange={(event) => setForm((value) => ({ ...value, EsTitular: event.target.value }))} required className="input-field"><option value="">Seleccionar una opción</option><option value="true">Sí, es titular</option><option value="false">No es titular</option></select></div><div className="people-form-note"><Info size={17} /><p>Los servicios se solicitarán desde la cuenta del socio y serán revisados posteriormente por la cooperativa.</p></div><footer className="people-form-footer"><button type="button" className="btn-secondary" onClick={close} disabled={saving}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? 'Creando cuenta…' : 'Crear socio'}</button></footer></form></div></div>
}
