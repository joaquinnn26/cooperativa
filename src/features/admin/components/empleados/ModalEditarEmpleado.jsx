import React, { useEffect, useState } from 'react'
import { useEmpleados } from '@/hooks/useEmpleados.js'

const initialForm = {
  Nombre: '',
  Apellido: '',
  Documento: '',
  Telefono: '',
  Email: '',
  idCargo: ''
}

export default function ModalEditarEmpleado({ show, empleado, onClose, onRefresh }) {
  const { cargos, loadingCatalogos, catalogosError, fetchCatalogos } = useEmpleados(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !empleado) return

    fetchCatalogos()
    setError('')
    setForm({
      Nombre: empleado.Persona?.Nombre || '',
      Apellido: empleado.Persona?.Apellido || '',
      Documento: empleado.Persona?.Documento || '',
      Telefono: empleado.Persona?.Telefono || '',
      Email: empleado.Persona?.Email || '',
      idCargo: empleado.idCargo ? String(empleado.idCargo) : ''
    })
  }, [show, empleado, fetchCatalogos])

  const handleClose = () => {
    if (saving) return
    setError('')
    setForm(initialForm)
    onClose()
  }

  const handleSubmit = async () => {
    setError('El backend actual no expone un endpoint para editar empleados.')
  }

  if (!show || !empleado) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Editar empleado</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.Nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, Nombre: e.target.value }))}
            placeholder="Nombre"
            className="input-field"
            disabled
          />
          <input
            value={form.Apellido}
            onChange={(e) => setForm((prev) => ({ ...prev, Apellido: e.target.value }))}
            placeholder="Apellido"
            className="input-field"
            disabled
          />
          <input
            value={form.Documento}
            onChange={(e) => setForm((prev) => ({ ...prev, Documento: e.target.value }))}
            placeholder="Documento"
            className="input-field"
            disabled
          />
          <input
            value={form.Telefono}
            onChange={(e) => setForm((prev) => ({ ...prev, Telefono: e.target.value }))}
            placeholder="Telefono"
            className="input-field"
            disabled
          />
          <input
            value={form.Email}
            onChange={(e) => setForm((prev) => ({ ...prev, Email: e.target.value }))}
            placeholder="Email"
            className="input-field md:col-span-2"
            disabled
          />
          <select
            value={form.idCargo}
            onChange={(e) => setForm((prev) => ({ ...prev, idCargo: e.target.value }))}
            className="input-field md:col-span-2"
            disabled
          >
            <option value="">Seleccionar cargo...</option>
            {cargos.map((cargo) => (
              <option key={cargo.idCargo} value={cargo.idCargo}>
                {cargo.Nombre}
              </option>
            ))}
          </select>
          {!loadingCatalogos && !cargos.length ? (
            <p className="text-sm text-red-600 md:col-span-2">
              {catalogosError || 'No hay cargos disponibles para seleccionar.'}
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-60"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled
          >
            Edicion no disponible
          </button>
        </div>
      </div>
    </div>
  )
}
