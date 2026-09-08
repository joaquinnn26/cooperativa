import React, { useEffect, useState } from 'react'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { firstValidationError, isPositiveNumber } from '@/utils/validation.js'

const initialForm = {
  Nombre: '',
  Apellido: '',
  Documento: '',
  idCargo: ''
}

export default function ModalEditarEmpleado({ show, empleado, onClose, onRefresh }) {
  const { cargos, loadingCatalogos, catalogosError, fetchCatalogos, editarEmpleado } = useEmpleados(false)
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
      idCargo: empleado.idCargo ? String(empleado.idCargo) : ''
    })
  }, [show, empleado, fetchCatalogos])

  useEffect(() => {
    if (!show || !empleado || form.idCargo || !cargos.length) return

    const cargoActual = cargos.find(
      (cargo) => String(cargo.Nombre).trim().toLowerCase() === String(empleado.Cargo?.Nombre || '').trim().toLowerCase()
    )

    if (cargoActual?.idCargo != null) {
      setForm((prev) => ({ ...prev, idCargo: String(cargoActual.idCargo) }))
    }
  }, [cargos, empleado, form.idCargo, show])

  const handleClose = () => {
    if (saving) return
    setError('')
    setForm(initialForm)
    onClose()
  }

  const handleSubmit = async () => {
    if (!empleado) return

    const idCargo = Number(form.idCargo)
    const validationError = firstValidationError([
      !isPositiveNumber(idCargo) ? 'Selecciona un cargo valido.' : '',
      cargos.some((cargo) => String(cargo.idCargo) === String(form.idCargo)) ? '' : 'El cargo seleccionado ya no esta disponible.'
    ])

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')

    try {
      await editarEmpleado(empleado.idEmpleado, {
        idCargo,
        FechaDeInicio: empleado.FechaDelInicio
      })

      await onRefresh?.()
      handleClose()
    } catch (saveError) {
      console.error('Error al editar empleado', saveError)
      setError(saveError.message || 'No se pudo editar el empleado.')
    } finally {
      setSaving(false)
    }
  }

  if (!show || !empleado) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Editar empleado</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input value={form.Nombre} placeholder="Nombre" className="input-field" disabled />
          <input value={form.Apellido} placeholder="Apellido" className="input-field" disabled />
          <input value={form.Documento} placeholder="Documento" className="input-field md:col-span-2" disabled />

          <select
            value={form.idCargo}
            onChange={(e) => setForm((prev) => ({ ...prev, idCargo: e.target.value }))}
            className="input-field"
            disabled={saving || loadingCatalogos}
          >
            <option value="">Seleccionar cargo...</option>
            {cargos.map((cargo) => (
              <option key={cargo.idCargo} value={cargo.idCargo}>
                {cargo.Nombre}
              </option>
            ))}
          </select>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            La fecha de inicio no se puede modificar desde esta pantalla.
          </div>

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
            disabled={saving || loadingCatalogos}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
