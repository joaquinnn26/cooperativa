import React, { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Pencil, Plus, Power, X } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { cleanText, FIELD_LIMITS, firstValidationError, isPositiveNumber, validateMeaningfulText, validateServiceName } from '@/utils/validation.js'

const initialForm = {
  idServicio: '',
  Nombre: '',
  Descripcion: ''
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function dedupeRequirements(requirements) {
  const map = new Map()

  requirements.forEach((requirement) => {
    const key = requirement.idRequisitoServicio
      ? `id:${requirement.idRequisitoServicio}`
      : `service:${requirement.idServicio}:name:${normalizeText(requirement.Nombre)}`
    map.set(key, requirement)
  })

  return Array.from(map.values())
}

export default function AdminRequisitosServicio() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchServicesCatalog = useServiceWorkflowStore((state) => state.fetchServicesCatalog)
  const fetchAllRequirements = useServiceWorkflowStore((state) => state.fetchAllRequirements)
  const createRequirement = useServiceWorkflowStore((state) => state.createRequirement)
  const updateRequirement = useServiceWorkflowStore((state) => state.updateRequirement)
  const toggleRequirementStatus = useServiceWorkflowStore((state) => state.toggleRequirementStatus)

  const [services, setServices] = useState([])
  const [requirements, setRequirements] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState('todos')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = async () => {
    const [servicesData, requirementsData] = await Promise.all([fetchServicesCatalog(), fetchAllRequirements()])
    const activeServices = (servicesData || []).filter((item) => item.Activo)
    setServices(activeServices)
    setRequirements(dedupeRequirements(requirementsData || []))

    if (selectedServiceId === 'todos' && activeServices[0]?.idServicio) {
      setSelectedServiceId(String(activeServices[0].idServicio))
    }
  }

  useEffect(() => {
    loadData()
  }, [fetchAllRequirements, fetchServicesCatalog])

  const groupedRequirements = useMemo(() => {
    return requirements.reduce((acc, item) => {
      const key = String(item.idServicio)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [requirements])

  const visibleServices = useMemo(() => {
    if (selectedServiceId === 'todos') return services
    return services.filter((service) => String(service.idServicio) === String(selectedServiceId))
  }, [selectedServiceId, services])

  const openCreateModal = (serviceId = selectedServiceId) => {
    setEditingId(null)
    setForm({
      ...initialForm,
      idServicio: serviceId !== 'todos' ? String(serviceId) : String(services[0]?.idServicio || '')
    })
    setModalOpen(true)
  }

  const openEditModal = (requirement) => {
    setEditingId(requirement.idRequisitoServicio)
    setForm({
      idServicio: String(requirement.idServicio),
      Nombre: requirement.Nombre,
      Descripcion: requirement.Descripcion
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(initialForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = firstValidationError([
      !isPositiveNumber(form.idServicio) ? 'Selecciona un servicio valido.' : '',
      validateServiceName(form.Nombre, 'El nombre del requisito'),
      validateMeaningfulText(form.Descripcion, 'La descripcion del requisito', FIELD_LIMITS.description)
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    const payload = {
      ...form,
      idServicio: Number(form.idServicio),
      Nombre: cleanText(form.Nombre),
      Descripcion: cleanText(form.Descripcion)
    }

    try {
      if (editingId) {
        await updateRequirement(editingId, payload)
        addNotification({ title: 'Requisito actualizado', message: 'Se guardaron los cambios.', type: 'success' })
      } else {
        await createRequirement(payload)
        addNotification({ title: 'Requisito creado', message: 'Se agrego un nuevo requisito.', type: 'success' })
      }

      closeModal()
      await loadData()
    } catch (error) {
      addNotification({ title: 'Error', message: error.message || 'No se pudo guardar el requisito.', type: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Requisitos</h1>
          <p className="mt-2 text-gray-600">Primero elegi un servicio. Despues ves y administras solo sus requisitos.</p>
        </div>
        <div className="rounded-full bg-violet-100 p-3 text-violet-700">
          <ClipboardCheck className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {services.map((service) => (
          <button
            key={service.idServicio}
            type="button"
            onClick={() => setSelectedServiceId(String(service.idServicio))}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              String(selectedServiceId) === String(service.idServicio)
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {service.Nombre}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Servicio seleccionado</p>
          <p className="text-xl font-semibold text-gray-900">
            {services.find((item) => String(item.idServicio) === String(selectedServiceId))?.Nombre || 'Sin seleccionar'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo requisito
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleServices.map((service) => {
          const serviceRequirements = groupedRequirements[String(service.idServicio)] || []

          return (
            <div key={service.idServicio} className="card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{service.Nombre}</h2>
                  <p className="text-sm text-gray-500">{serviceRequirements.length} requisito(s) cargado(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateModal(service.idServicio)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-3">
                {serviceRequirements.map((requirement) => (
                  <div key={requirement.idRequisitoServicio} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{requirement.Nombre}</p>
                        <p className="mt-1 text-sm text-gray-600">{requirement.Descripcion}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          requirement.Activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {requirement.Activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(requirement)}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleRequirementStatus(requirement.idRequisitoServicio)
                          await loadData()
                        }}
                        className="inline-flex items-center rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        <Power className="mr-1 h-4 w-4" />
                        Cambiar estado
                      </button>
                    </div>
                  </div>
                ))}

                {!serviceRequirements.length ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Este servicio todavia no tiene requisitos cargados.
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6">
          <div className="mx-auto max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{editingId ? 'Editar requisito' : 'Nuevo requisito'}</h2>
                <p className="text-sm text-gray-500">Completá los datos del requisito.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <select
                value={form.idServicio}
                onChange={(event) => setForm((prev) => ({ ...prev, idServicio: event.target.value }))}
                className="input-field"
                required
              >
                <option value="">Seleccionar servicio...</option>
                {services.map((service) => (
                  <option key={service.idServicio} value={service.idServicio}>
                    {service.Nombre}
                  </option>
                ))}
              </select>

              <input
                value={form.Nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, Nombre: event.target.value }))}
                minLength={FIELD_LIMITS.serviceName.min}
                maxLength={FIELD_LIMITS.serviceName.max}
                className="input-field"
                placeholder="Nombre del requisito"
                required
              />

              <textarea
                value={form.Descripcion}
                onChange={(event) => setForm((prev) => ({ ...prev, Descripcion: event.target.value }))}
                minLength={FIELD_LIMITS.description.min}
                maxLength={FIELD_LIMITS.description.max}
                className="input-field min-h-28"
                placeholder="Descripcion del requisito"
                required
              />

              <div className="flex gap-2 pt-2">
                <button type="submit" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? 'Guardar cambios' : 'Crear requisito'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
