import React, { useEffect, useMemo, useState } from 'react'
import { Droplet, Pencil, PlusCircle, ToggleRight, Trash2, Wifi, Wrench, X, Zap } from 'lucide-react'

import { useServicios } from '@/hooks/useServicios.js'
import { confirmAction, showToast } from '@/utils/alerts.js'
import { cleanText, firstValidationError, isPositiveNumber, validateRequired } from '@/utils/validation.js'

const initialForm = {
  idServicio: null,
  nombre: '',
  descripcion: '',
  idTipoTarifa: '',
  tarifaBase: ''
}

function getServicioIcon(nombre = '') {
  const normalized = nombre.toLowerCase()

  if (normalized.includes('agua')) return Droplet
  if (normalized.includes('luz') || normalized.includes('energ')) return Zap
  if (normalized.includes('internet') || normalized.includes('wifi')) return Wifi

  return Wrench
}

function formatTarifa(value) {
  const amount = Number(value)

  if (Number.isNaN(amount)) return '$0,00'

  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  })
}

function ModalCrearServicio({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  tiposTarifa,
  loadingTiposTarifa,
  saving,
  error,
  mode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Modificar servicio' : 'Nuevo servicio'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'edit'
                ? 'Actualiza los datos del servicio seleccionado.'
                : 'Crea un servicio y asignale un tipo de tarifa.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              className="input-field"
              placeholder="Ej. Recoleccion"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={onChange}
              className="input-field"
              placeholder="Describe el servicio"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de tarifa</label>
              <select
                name="idTipoTarifa"
                value={form.idTipoTarifa}
                onChange={onChange}
                className="input-field"
                required
                disabled={loadingTiposTarifa}
              >
                <option value="">
                  {loadingTiposTarifa ? 'Cargando tipos de tarifa...' : 'Selecciona un tipo'}
                </option>
                {tiposTarifa.map((tipo) => (
                  <option key={tipo.idTipoTarifa} value={tipo.idTipoTarifa}>
                    {tipo.NombreTipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tarifa base</label>
              <input
                name="tarifaBase"
                type="number"
                min="0"
                step="0.01"
                value={form.tarifaBase}
                onChange={onChange}
                className="input-field"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || loadingTiposTarifa}>
              {saving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminServicios() {
  const {
    servicios,
    loadingServicios,
    tiposTarifa,
    loadingTiposTarifa,
    fetchTiposTarifa,
    crearServicio,
    editarServicio,
    eliminarServicio
  } = useServicios(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [modalMode, setModalMode] = useState('create')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (modalOpen && !tiposTarifa.length) {
      fetchTiposTarifa()
    }
  }, [modalOpen, tiposTarifa.length, fetchTiposTarifa])

  const filtered = useMemo(() => {
    const query = search.toLowerCase()

    return servicios.filter((servicio) => {
      const nombre = (servicio.Nombre || servicio.nombre || '').toLowerCase()
      const descripcion = (servicio.Descripcion || servicio.descripcion || '').toLowerCase()
      const tipoTarifa = (servicio.TipoTarifa || servicio.tipoTarifa || '').toLowerCase()

      return nombre.includes(query) || descripcion.includes(query) || tipoTarifa.includes(query)
    })
  }, [servicios, search])

  const handleOpenModal = async () => {
    setModalMode('create')
    setModalOpen(true)
    setFormError('')
    setForm(initialForm)

    if (!tiposTarifa.length) {
      await fetchTiposTarifa()
    }
  }

  const handleEdit = async (servicio) => {
    setModalMode('edit')
    setFormError('')
    setForm({
      idServicio: servicio.idServicio,
      nombre: servicio.Nombre || servicio.nombre || '',
      descripcion: servicio.Descripcion || servicio.descripcion || '',
      idTipoTarifa: String(servicio.idTipoTarifa || ''),
      tarifaBase: String(servicio.TarifaBase ?? servicio.tarifaBase ?? '')
    })
    setModalOpen(true)

    if (!tiposTarifa.length) {
      await fetchTiposTarifa()
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSaving(false)
    setFormError('')
    setForm(initialForm)
    setModalMode('create')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = firstValidationError([
      validateRequired(form.nombre, 'El nombre'),
      validateRequired(form.descripcion, 'La descripcion'),
      !isPositiveNumber(form.idTipoTarifa) ? 'Selecciona un tipo de tarifa valido.' : '',
      !isPositiveNumber(form.tarifaBase) ? 'La tarifa base debe ser mayor a cero.' : ''
    ])

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const payload = {
        Nombre: cleanText(form.nombre),
        Descripcion: cleanText(form.descripcion),
        idTipoTarifa: Number(form.idTipoTarifa),
        TarifaBase: Number(form.tarifaBase)
      }

      if (modalMode === 'edit') {
        await editarServicio(form.idServicio, payload)
      } else {
        await crearServicio(payload)
      }

      handleCloseModal()
    } catch (error) {
      console.error('Error al guardar servicio', error)
      setFormError('No se pudo guardar el servicio. Revisa los datos e intenta nuevamente.')
      setSaving(false)
    }
  }

  const handleDelete = async (servicio) => {
    const confirmed = await confirmAction({
      title: 'Eliminar servicio',
      message: `Eliminar el servicio "${servicio.Nombre || servicio.nombre}"?`,
      confirmButtonText: 'Eliminar',
      type: 'warning',
      danger: true
    })

    if (!confirmed) return

    setDeletingId(servicio.idServicio)

    try {
      await eliminarServicio(servicio.idServicio)
      showToast({
        title: 'Servicio eliminado',
        message: 'El servicio se elimino correctamente.',
        type: 'success'
      })
    } catch (error) {
      console.error('Error al eliminar servicio', error)
      showToast({
        title: 'Error',
        message: 'No se pudo eliminar el servicio.',
        type: 'error'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const serviciosView = filtered.map((servicio) => ({
    id: servicio.idServicio,
    raw: servicio,
    nombre: servicio.Nombre || servicio.nombre || 'Servicio sin nombre',
    descripcion: servicio.Descripcion || servicio.descripcion || 'Sin descripcion',
    tipoTarifa: servicio.TipoTarifa || servicio.tipoTarifa || 'Sin tipo de tarifa',
    tarifaBase: servicio.TarifaBase ?? servicio.tarifaBase ?? 0
  }))

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
            <p className="text-gray-600">Configura tarifas y disponibilidad</p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="btn-primary inline-flex items-center px-4 py-2 text-base"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nuevo servicio
          </button>
        </div>

        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar servicio..."
              className="input-field"
            />
          </div>

          <div className="space-y-3">
            {loadingServicios ? <p className="text-center text-gray-500">Cargando servicios...</p> : null}

            {!loadingServicios &&
              serviciosView.map((servicio) => {
                const Icon = getServicioIcon(servicio.nombre)

                return (
                  <div
                    key={servicio.id}
                    className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{servicio.nombre}</h3>
                        <p className="text-sm text-gray-600">
                          {servicio.tipoTarifa} - Tarifa: {formatTarifa(servicio.tarifaBase)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{servicio.descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded bg-green-100 px-3 py-2 text-sm font-semibold text-green-700">
                        <ToggleRight className="mr-1 h-4 w-4" />
                        Disponible
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(servicio.raw)}
                        className="inline-flex items-center rounded bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Modificar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(servicio.raw)}
                        disabled={deletingId === servicio.id}
                        className="inline-flex items-center rounded bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {deletingId === servicio.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                )
              })}

            {!loadingServicios && !serviciosView.length ? (
              <p className="text-center text-gray-500">Sin servicios.</p>
            ) : null}
          </div>
        </div>
      </div>

      <ModalCrearServicio
        open={modalOpen}
        onClose={handleCloseModal}
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        tiposTarifa={tiposTarifa}
        loadingTiposTarifa={loadingTiposTarifa}
        saving={saving}
        error={formError}
        mode={modalMode}
      />
    </>
  )
}
