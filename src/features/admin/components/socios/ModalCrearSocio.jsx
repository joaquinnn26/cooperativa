import React, { useState } from 'react'
import { useSocios } from '@/hooks/useSocios.js'
import { showInfo, showToast } from '@/utils/alerts.js'

export default function ModalCrearSocio({ show, onClose, onSaved }) {
  const { crearSocio } = useSocios(false)
  const [form, setForm] = useState({
    Nombre: '',
    Apellido: '',
    Documento: '',
    Telefono: '',
    Email: '',
    Calle: '',
    Numero: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      const socio = await crearSocio(form)

      await showInfo({
        title: 'Socio creado',
        message: `Usuario: ${socio?.usuario ?? form.Documento}\nContrasena temporal: ${socio?.passwordTemporal ?? ''}`,
        type: 'success'
      })

      setForm({
        Nombre: '',
        Apellido: '',
        Documento: '',
        Telefono: '',
        Email: '',
        Calle: '',
        Numero: ''
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
                name={field}
                value={form[field]}
                onChange={handleChange}
                placeholder={field}
                required={['Nombre', 'Apellido', 'Documento'].includes(field)}
                className="input-field"
              />
            ))}
          </div>

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
