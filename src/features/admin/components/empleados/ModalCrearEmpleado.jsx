import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import { firstValidationError, isPositiveNumber, validateStrongPassword } from '@/utils/validation.js'

const initialForm = {
  idPersona: '',
  PasswordLaboral: ''
}

export default function ModalCrearEmpleado({ show, onClose, onSaved, empleadosExistentes = [] }) {
  const navigate = useNavigate()
  const {
    personasRegistradas,
    loadingCatalogos,
    catalogosError,
    fetchCatalogos,
    crearEmpleado
  } = useEmpleados(false)

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

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
      const docKey = socio.Documento != null ? String(socio.Documento) : null
      return !(idKey && usedKeys.has(idKey)) && !(docKey && usedKeys.has(docKey))
    })
  }, [empleadosExistentes, personasRegistradas])

  const handleClose = () => {
    if (saving) return
    setForm(initialForm)
    setCreated(null)
    setError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving || created) return
    const idPersona = Number(form.idPersona)
    const validationError = firstValidationError([
      validateStrongPassword(form.PasswordLaboral, "La contraseña laboral"),
      !isPositiveNumber(idPersona) ? 'Seleccioná una persona válida.' : '',
      personasElegibles.some((socio) => String(socio.idPersona) === String(form.idPersona)) ? '' : 'La persona seleccionada ya no está disponible.',
    ])

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')

    try {
      const today = new Date().toISOString().slice(0, 10)

      const result = await crearEmpleado({
        idPersona,
        FechaDeInicio: today,
        PasswordLaboral: form.PasswordLaboral
      })

      const person = personasElegibles.find(item => String(item.idPersona) === String(idPersona))
      setCreated({ idEmpleado: result.idEmpleado, nombre: `${person.Nombre} ${person.Apellido}`, email: person.Email, documento: person.Documento })
      setForm(initialForm)
      await onSaved?.()
    } catch (saveError) {
      console.error('Error al crear empleado', saveError)
      setError(saveError.message || 'No se pudo completar la operación.')
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="alta-empleado-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="alta-empleado-title" className="mb-4 text-xl font-bold">{created ? 'Empleado y cuenta creados' : 'Dar de alta un empleado'}</h2>
        {created ? <div className="space-y-5">
          <div role="status" className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="shrink-0" size={24} /><div><strong>{created.nombre}</strong><p className="mt-1 text-sm">Ya tiene su usuario laboral y puede iniciar sesión.</p></div></div>
          <div className="rounded-xl border border-slate-200 p-4 text-sm"><h3 className="font-semibold">Datos para ingresar</h3><p className="mt-3">Elegir <strong>Empleado</strong> en la pantalla de inicio de sesión.</p>{created.email && <p className="mt-2 break-all">Correo: <strong>{created.email}</strong></p>}<p className="mt-2">DNI: <strong>{created.documento || 'El documento registrado'}</strong></p><p className="mt-2 text-slate-600">Contraseña: la contraseña laboral que acabás de definir.</p></div>
          <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">Por ahora verá <strong>«Aún no tenés un área y un puesto asignados»</strong>. Asignale un área y un puesto para habilitar su espacio de trabajo.</p>
          {error && <p role="alert" className="text-sm text-red-700">El alta se guardó, pero no se pudo actualizar el listado: {error}</p>}
          <div className="flex flex-wrap justify-end gap-3"><button disabled={saving} className="btn-secondary" onClick={handleClose}>Asignar después</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60" onClick={() => { const id = created.idEmpleado; handleClose(); navigate(`/admin/organizacion?empleado=${encodeURIComponent(id)}`) }}>Asignar área y puesto <ArrowRight size={17} /></button></div>
        </div> : <form onSubmit={handleSubmit}>
        <p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">Al guardar se crean el empleado y su usuario laboral en una sola operación. La asignación de área y puesto se realiza después.</p>

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

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Pendiente de asignación</strong><p className="mt-1">El empleado se crea sin cargo ni área. Los vas a definir juntos desde Organización laboral.</p></div>
          {catalogosError && <p role="alert" className="text-sm text-red-700">{catalogosError}</p>}
          <label className="block">Contraseña inicial laboral<input disabled={saving} type="password" autoComplete="new-password" required minLength={8} maxLength={100} className="input-field" value={form.PasswordLaboral} onChange={e => setForm(f => ({ ...f, PasswordLaboral: e.target.value }))} /></label>
          <p className="text-sm text-gray-600">Incluí mayúscula, minúscula, número y símbolo. Se crea una cuenta laboral independiente; la cuenta de socio se conserva. Después asigná su área y puesto.</p>
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
            type="button"
            onClick={handleClose}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-60"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
            disabled={saving || loadingCatalogos || !personasElegibles.length}
          >
            {saving ? 'Creando empleado y cuenta…' : 'Crear empleado y cuenta'}
          </button>
        </div>
        </form>}
      </div>
    </div>
  )
}
