import React, { useState } from 'react'
import { useSocios } from '@/hooks/useSocios.js'
import { showInfo, showToast } from '@/utils/alerts.js'
import {
  firstValidationError,
  FIELD_LIMITS,
  isBlank,
  sanitizePersonPayload,
  validateAddress,
  validateDocument,
  validateEmail,
  validateHouseNumber,
  validatePersonName,
  validatePhone
} from '@/utils/validation.js'

const FIELD_CONFIG = {
  Nombre: { minLength: FIELD_LIMITS.personName.min, maxLength: FIELD_LIMITS.personName.max },
  Apellido: { minLength: FIELD_LIMITS.personName.min, maxLength: FIELD_LIMITS.personName.max },
  Documento: { minLength: FIELD_LIMITS.document.min, maxLength: FIELD_LIMITS.document.max, inputMode: 'numeric' },
  Telefono: { minLength: FIELD_LIMITS.phone.min, maxLength: FIELD_LIMITS.phone.max },
  Email: { minLength: FIELD_LIMITS.email.min, maxLength: FIELD_LIMITS.email.max, type: 'email' },
  Calle: { minLength: FIELD_LIMITS.address.min, maxLength: FIELD_LIMITS.address.max },
  Numero: { minLength: FIELD_LIMITS.houseNumber.min, maxLength: FIELD_LIMITS.houseNumber.max }
}

export default function ModalCrearSocio({ show, onClose, onSaved }) {
  const { crearSocio } = useSocios(false)
  const [form, setForm] = useState({
    Nombre: '',
    Apellido: '',
    Documento: '',
    Telefono: '',
    Email: '',
    Calle: '',
    Numero: '',
    EsTitular: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const sanitized = sanitizePersonPayload(form)
    const validationError = firstValidationError([
      validatePersonName(sanitized.Nombre, 'El nombre'),
      validatePersonName(sanitized.Apellido, 'El apellido'),
      validateDocument(sanitized.Documento),
      validatePhone(sanitized.Telefono),
      validateEmail(sanitized.Email),
      !isBlank(sanitized.Calle) && validateAddress(sanitized.Calle),
      !isBlank(sanitized.Numero) && validateHouseNumber(sanitized.Numero),
      !form.EsTitular ? 'Indica si el solicitante es titular del domicilio.' : ''
    ])

    if (validationError) {
      showToast({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    try {
      const socio = await crearSocio({ ...sanitized, EsTitular: form.EsTitular === 'true' })

      await showInfo({
        title: 'Cuenta creada pendiente de documentación',
        message: `Usuario: ${socio?.usuario ?? form.Documento}\nContrasena temporal: ${socio?.passwordTemporal ?? ''}\n\nEl socio debe ingresar y completar su documentación para que Administración apruebe el alta.`,
        type: 'success'
      })

      setForm({
        Nombre: '',
        Apellido: '',
        Documento: '',
        Telefono: '',
        Email: '',
        Calle: '',
        Numero: '',
        EsTitular: ''
      })
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Error al crear socio', error)
      showToast({
        title: 'Error',
        message: error.message || 'No se pudo crear el socio.',
        type: 'error'
      })
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          x
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-900">Agregar Nuevo Socio</h2>

        <form onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {['Nombre', 'Apellido', 'Documento', 'Telefono', 'Email', 'Calle', 'Numero'].map((field) => (
              <input
                key={field}
                type={FIELD_CONFIG[field]?.type || 'text'}
                name={field}
                value={form[field]}
                onChange={handleChange}
                placeholder={field}
                required={['Nombre', 'Apellido', 'Documento'].includes(field)}
                minLength={FIELD_CONFIG[field]?.minLength}
                maxLength={FIELD_CONFIG[field]?.maxLength}
                inputMode={FIELD_CONFIG[field]?.inputMode}
                className="input-field"
              />
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-gray-700">¿El solicitante es titular del domicilio?<select name="EsTitular" value={form.EsTitular} onChange={handleChange} required className="input-field mt-2"><option value="">Seleccionar</option><option value="true">Sí</option><option value="false">No</option></select></label>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Los servicios se pediran desde la cuenta del socio y se aprobaran luego desde solicitudes.
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
