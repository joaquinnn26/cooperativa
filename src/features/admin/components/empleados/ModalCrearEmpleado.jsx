import React, { useEffect, useMemo, useState } from 'react'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { firstValidationError, isPositiveNumber, validateStrongPassword } from '@/utils/validation.js'

const initialForm = {
  idPersona: '',
  idCargo: '',
  PasswordLaboral: ''
}

export default function ModalCrearEmpleado({ show, onClose, onSaved, empleadosExistentes = [] }) {
  const {
    cargos,
    personasRegistradas,
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

  const personasElegibles = useMemo(() => {
    const usedKeys = new Set(
      empleadosExistentes
        .flatMap((empleado) => [
          empleado.idPersona != null ? String(empleado.idPersona) : null,
          empleado.Persona?.Documento != null ? String(empleado.Persona.Documento) : null
        ])
        .filter(Boolean)
    )

    return personasRegistradas.filter((socio) => {
      const idKey = socio.idPersona != null ? String(socio.idPersona) : null
      const docKey = socio.Documento != null ? String(socio.Persona.Documento) : null
      return !(idKey && usedKeys.has(idKey)) && !(docKey && usedKeys.has(docKey))
    })
  }, [empleadosExistentes, personasRegistradas])

  const handleClose = () => {
    if (saving) return
    setForm(initialForm)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    const idPersona = Number(form.idPersona)
    const idCargo = Number(form.idCargo)
    const validationError = firstValidationError([
      validateStrongPassword(form.PasswordLaboral, "La contraseña laboral"),
      !isPositiveNumber(idPersona) ? 'Seleccioná una persona válida.' : '',
      !isPositiveNumber(idCargo) ? 'Selecciona un cargo valido.' : '',
      personasElegibles.some((socio) => String(socio.idPersona) === String(form.idPersona)) ? '' : 'La persona seleccionada ya no está disponible.',
      cargos.some((cargo) => String(cargo.idCargo) === String(form.idCargo)) ? '' : 'El cargo seleccionado ya no esta disponible.'
    ])

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')

    try {
      const today = new Date().toISOString().slice(0, 10)

      await crearEmpleado({
        idPersona,
        idCargo,
        FechaDeInicio: today,
        PasswordLaboral: form.PasswordLaboral
      })

      await onSaved?.()
      setForm(initialForm)
      onClose()
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
        <h2 className="mb-4 text-xl font-bold">Dar de alta un empleado</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Persona registrada</label>
            <select
              value={form.idPersona}
              onChange={(e) => setForm((prev) => ({ ...prev, idPersona: e.target.value }))}
              className="input-field"
              disabled={saving || loadingCatalogos}
            >
              <option value="">Seleccionar persona...</option>
              {personasElegibles.map((socio) => (
                <option key={socio.idPersona} value={socio.idPersona}>
                  {socio.Apellido}, {socio.Nombre} - Doc. {socio.Documento}
                </option>
              ))}
            </select>
            {!loadingCatalogos && !personasElegibles.length ? (
              <p className="mt-1 text-sm text-gray-500">
                No hay personas disponibles. Registrá sus datos personales antes del alta laboral.
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
          <label className="block">Contraseña inicial laboral<input type="password" autoComplete="new-password" required minLength={8} maxLength={100} className="input-field" value={form.PasswordLaboral} onChange={e => setForm(f => ({ ...f, PasswordLaboral: e.target.value }))} /></label>
          <p className="text-sm text-gray-600">Incluí mayúscula, minúscula, número y símbolo. Se crea una cuenta laboral independiente; la cuenta de socio se conserva. Después asigná sus áreas y funciones.</p>
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
            disabled={saving || loadingCatalogos || !personasElegibles.length}
          >
            {saving ? 'Guardando...' : 'Crear empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}
