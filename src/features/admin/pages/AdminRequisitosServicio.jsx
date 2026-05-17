import React, { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Pencil, Plus, Power } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'

const initialForm = {
  idServicio: '',
  Nombre: '',
  Descripcion: ''
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
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  const loadData = async () => {
    const [servicesData, requirementsData] = await Promise.all([
      fetchServicesCatalog(),
      fetchAllRequirements()
    ])
    setServices(servicesData)
    setRequirements(requirementsData)
  }

  useEffect(() => {
    loadData()
  }, [fetchAllRequirements, fetchServicesCatalog])

  const serviceOptions = useMemo(() => services.filter((item) => item.Activo), [services])

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      if (editingId) {
        await updateRequirement(editingId, form)
        addNotification({ title: 'Requisito actualizado', message: 'Se guardaron los cambios.', type: 'success' })
      } else {
        await createRequirement(form)
        addNotification({ title: 'Requisito creado', message: 'Se agrego un nuevo requisito.', type: 'success' })
      }

      setForm(initialForm)
      setEditingId(null)
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
          <p className="mt-2 text-gray-600">Crea, edita y activa o desactiva requisitos por servicio.</p>
        </div>
        <div className="rounded-full bg-violet-100 p-3 text-violet-700">
          <ClipboardCheck className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingId ? 'Editar requisito' : 'Nuevo requisito'}
          </h2>
          <select
            value={form.idServicio}
            onChange={(event) => setForm((prev) => ({ ...prev, idServicio: event.target.value }))}
            className="input-field"
            required
          >
            <option value="">Seleccionar servicio...</option>
            {serviceOptions.map((service) => (
              <option key={service.idServicio} value={service.idServicio}>
                {service.Nombre}
              </option>
            ))}
          </select>

          <input
            value={form.Nombre}
            onChange={(event) => setForm((prev) => ({ ...prev, Nombre: event.target.value }))}
            className="input-field"
            placeholder="Nombre requisito"
            required
          />

          <textarea
            value={form.Descripcion}
            onChange={(event) => setForm((prev) => ({ ...prev, Descripcion: event.target.value }))}
            className="input-field min-h-28"
            placeholder="Descripcion"
            required
          />

          <div className="flex gap-2">
            <button type="submit" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? 'Guardar cambios' : 'Agregar requisito'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(initialForm)
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Requisito</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((requirement) => {
                const service = services.find((item) => item.idServicio === requirement.idServicio)
                return (
                  <tr key={requirement.idRequisitoServicio} className="border-t border-gray-100">
                    <td className="px-4 py-4">{service?.Nombre || `Servicio ${requirement.idServicio}`}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{requirement.Nombre}</p>
                      <p className="text-xs text-gray-500">{requirement.Descripcion}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${requirement.Activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {requirement.Activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(requirement.idRequisitoServicio)
                            setForm({
                              idServicio: String(requirement.idServicio),
                              Nombre: requirement.Nombre,
                              Descripcion: requirement.Descripcion
                            })
                          }}
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
                          Estado
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
