import React, { useEffect, useMemo, useState } from 'react'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { isPositiveNumber } from '@/utils/validation.js'

const initialForm = {
  idSocio: '',
  idCargo: ''
}

export default function ModalCrearEmpleado({ show, onClose, onSaved, empleadosExistentes = [] }) {
  const {
    cargos,
    sociosDisponibles,
    loadingCatalogos,
    catalogosError,
    fetchCatalogos,
    crearEmpleado
  } = useEmpleados(false)

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show) return
    fetchCatalogos()
  }, [show, fetchCatalogos])

  const sociosElegibles = useMemo(() => {
    const usedKeys = new Set(
      empleadosExistentes
        .flatMap((empleado) => [
          empleado.idPersona != null ? String(empleado.idPersona) : null,
          empleado.Persona?.Documento != null ? String(empleado.Persona.Documento) : null
        ])
        .filter(Boolean)
    )

    return sociosDisponibles.filter((socio) => {
      const idKey = socio.idPersona != null ? String(socio.idPersona) : null
      const docKey = socio.Persona?.Documento != null ? String(socio.Persona.Documento) : null
      return !(idKey && usedKeys.has(idKey)) && !(docKey && usedKeys.has(docKey))
    })
  }, [empleadosExistentes, sociosDisponibles])

  const handleClose = () => {
    if (saving) return
    setForm(initialForm)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!form.idSocio || !form.idCargo) {
      setError('Debes seleccionar un socio y un cargo.')
      return
    }

    const idSocio = Number(form.idSocio)
    const idCargo = Number(form.idCargo)

    if (!isPositiveNumber(idSocio) || !isPositiveNumber(idCargo)) {
      setError('Los datos seleccionados no son validos. Vuelve a elegir el socio y el cargo.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const today = new Date().toISOString().slice(0, 10)

      await crearEmpleado({
        idSocio,
        idCargo,
        FechaDeInicio: today
      })

      await onSaved?.()
      handleClose()
    } catch (saveError) {
      console.error('Error al crear empleado', saveError)
      setError(saveError.message || 'No se pudo crear el empleado.')
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Convertir persona en empleado</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Socio registrado</label>
            <select
              value={form.idSocio}
              onChange={(e) => setForm((prev) => ({ ...prev, idSocio: e.target.value }))}
              className="input-field"
              disabled={saving || loadingCatalogos}
            >
              <option value="">Seleccionar socio...</option>
              {sociosElegibles.map((socio) => (
                <option key={socio.idSocio} value={socio.idSocio}>
                  {socio.Persona?.Apellido}, {socio.Persona?.Nombre} - Doc. {socio.Persona?.Documento}
                </option>
              ))}
            </select>
            {!loadingCatalogos && !sociosElegibles.length ? (
              <p className="mt-1 text-sm text-gray-500">
                No hay socios disponibles para promover a empleado.
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cargo</label>
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
            {!loadingCatalogos && !cargos.length ? (
              <p className="mt-1 text-sm text-red-600">
                {catalogosError || 'No hay cargos disponibles para seleccionar.'}
              </p>
            ) : null}
          </div>
          <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            La fecha de inicio se asignara automaticamente con la fecha actual.
          </p>

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

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
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
            disabled={saving || loadingCatalogos || !sociosElegibles.length}
          >
            {saving ? 'Guardando...' : 'Crear empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}
