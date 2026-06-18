import React, { useEffect, useState } from 'react'
import { useSocios } from '@/hooks/useSocios.js'
import {
  firstValidationError,
  isBlank,
  isValidAddress,
  isValidHouseNumber,
  sanitizePersonPayload,
  validateDocument,
  validateEmail,
  validatePersonName,
  validatePhone
} from '@/utils/validation.js'

const initialForm = {
  Nombre: '',
  Apellido: '',
  Documento: '',
  Telefono: '',
  Email: '',
  Calle: '',
  Numero: '',
  ServiciosSeleccionados: []
}

export default function ModalEditarSocio({ show, socio, onClose, onRefresh }) {
  const {
    servicios,
    loadingServicios,
    fetchServicios,
    fetchServiciosSocio,
    editarSocio,
    asignarServicios
  } = useSocios(false)

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !socio) return

    let active = true

    const loadData = async () => {
      setError('')
      setLoadingAsignaciones(true)

      try {
        const [serviciosActuales] = await Promise.all([
          fetchServiciosSocio(socio.idSocio),
          fetchServicios()
        ])

        if (!active) return

        setForm({
          Nombre: socio.Persona?.Nombre || '',
          Apellido: socio.Persona?.Apellido || '',
          Documento: socio.Persona?.Documento || '',
          Telefono: socio.Persona?.Telefono || '',
          Email: socio.Persona?.Email || '',
          Calle: socio.Persona?.Calle || '',
          Numero: socio.Persona?.Numero || '',
          ServiciosSeleccionados: (serviciosActuales || []).map((idServicio) => Number(idServicio))
        })
      } catch (loadError) {
        console.error('Error al cargar datos del socio', loadError)

        if (!active) return

        setForm({
          Nombre: socio.Persona?.Nombre || '',
          Apellido: socio.Persona?.Apellido || '',
          Documento: socio.Persona?.Documento || '',
          Telefono: socio.Persona?.Telefono || '',
          Email: socio.Persona?.Email || '',
          Calle: socio.Persona?.Calle || '',
          Numero: socio.Persona?.Numero || '',
          ServiciosSeleccionados: (socio.Servicios || []).map((item) => Number(item.idServicio))
        })
        setError('No se pudieron cargar correctamente los servicios asociados.')
      } finally {
        if (active) {
          setLoadingAsignaciones(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [show, socio, fetchServicios, fetchServiciosSocio])

  const toggleServicio = (id) => {
    const normalizedId = Number(id)

    setForm((prev) => ({
      ...prev,
      ServiciosSeleccionados: prev.ServiciosSeleccionados.includes(normalizedId)
        ? prev.ServiciosSeleccionados.filter((serviceId) => serviceId !== normalizedId)
        : [...prev.ServiciosSeleccionados, normalizedId]
    }))
  }

  const guardar = async () => {
    if (!socio) return

    const sanitized = sanitizePersonPayload(form)
    const validationError = firstValidationError([
      validatePersonName(sanitized.Nombre, 'El nombre'),
      validatePersonName(sanitized.Apellido, 'El apellido'),
      validateDocument(sanitized.Documento),
      validatePhone(sanitized.Telefono),
      validateEmail(sanitized.Email),
      !isBlank(sanitized.Calle) && !isValidAddress(sanitized.Calle) ? 'La calle contiene caracteres invalidos.' : '',
      !isBlank(sanitized.Numero) && !isValidHouseNumber(sanitized.Numero) ? 'El numero de domicilio debe ser numerico.' : ''
    ])

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')

    try {
      await editarSocio(socio.idSocio, {
        Nombre: sanitized.Nombre,
        Apellido: sanitized.Apellido,
        Documento: sanitized.Documento,
        Telefono: sanitized.Telefono,
        Email: sanitized.Email,
        Calle: sanitized.Calle || null,
        Numero: sanitized.Numero || null
      })

      await asignarServicios(
        socio.idSocio,
        form.ServiciosSeleccionados.map((id) => Number(id))
      )

      await onRefresh?.()
      onClose()
    } catch (saveError) {
      console.error('Error al guardar socio', saveError)
      setError(saveError.message || 'No se pudo guardar el socio.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (saving) return

    setError('')
    setForm(initialForm)
    onClose()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Editar socio</h2>

        <div className="space-y-3">
          <input
            value={form.Nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, Nombre: e.target.value }))}
            placeholder="Nombre"
            className="input-field"
            disabled={saving}
          />
          <input
            value={form.Apellido}
            onChange={(e) => setForm((prev) => ({ ...prev, Apellido: e.target.value }))}
            placeholder="Apellido"
            className="input-field"
            disabled={saving}
          />

          <div>
            <p className="mb-1 font-semibold">Servicios asociados</p>
            {loadingServicios || loadingAsignaciones ? (
              <div className="text-gray-500">Cargando servicios...</div>
            ) : (
              <div className="flex max-h-40 flex-col space-y-1 overflow-y-auto">
                {servicios.map((servicio) => (
                  <label key={servicio.idServicio} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.ServiciosSeleccionados.includes(Number(servicio.idServicio))}
                      onChange={() => toggleServicio(servicio.idServicio)}
                      disabled={saving}
                    />
                    <span>{servicio.Nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

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
            onClick={guardar}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={saving || loadingServicios || loadingAsignaciones}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
