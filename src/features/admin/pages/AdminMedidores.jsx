import React, { useEffect, useMemo, useState } from 'react'
import { Gauge, Plus, Power } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'

const initialForm = {
  idServicioSocio: '',
  TipoMedidor: '',
  FechaInstalacion: ''
}

export default function AdminMedidores() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchAllServiceAssignments = useServiceWorkflowStore((state) => state.fetchAllServiceAssignments)
  const createMeter = useServiceWorkflowStore((state) => state.createMeter)
  const updateMeter = useServiceWorkflowStore((state) => state.updateMeter)
  const toggleMeterStatus = useServiceWorkflowStore((state) => state.toggleMeterStatus)

  const [meters, setMeters] = useState([])
  const [serviceAssignments, setServiceAssignments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingMeterId, setEditingMeterId] = useState(null)

  const loadData = async () => {
    const [metersData, assignmentsData] = await Promise.all([
      fetchMeters(),
      fetchAllServiceAssignments()
    ])
    setMeters(metersData)
    setServiceAssignments(assignmentsData)
  }

  useEffect(() => {
    loadData()
  }, [fetchAllServiceAssignments, fetchMeters])

  const eligibleAssignments = useMemo(
    () =>
      serviceAssignments.filter(
        (assignment) => assignment.estado === 'Activo' && !assignment.idMedidor
      ),
    [serviceAssignments]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      if (editingMeterId) {
        await updateMeter(editingMeterId, form)
        addNotification({ title: 'Medidor actualizado', message: 'Se guardaron los cambios.', type: 'success' })
      } else {
        await createMeter(form)
        addNotification({ title: 'Medidor instalado', message: 'El medidor se creo correctamente.', type: 'success' })
      }
      setForm(initialForm)
      setEditingMeterId(null)
      await loadData()
    } catch (error) {
      addNotification({ title: 'Error', message: error.message || 'No se pudo guardar el medidor.', type: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion Medidores</h1>
          <p className="mt-2 text-gray-600">Instala medidores sobre servicios aprobados y administra su estado.</p>
        </div>
        <div className="rounded-full bg-amber-100 p-3 text-amber-700">
          <Gauge className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{editingMeterId ? 'Editar medidor' : 'Instalar medidor'}</h2>

          <select
            value={form.idServicioSocio}
            onChange={(event) => setForm((prev) => ({ ...prev, idServicioSocio: event.target.value }))}
            className="input-field"
            required
            disabled={Boolean(editingMeterId)}
          >
            <option value="">Seleccionar servicio aprobado...</option>
            {eligibleAssignments.map((assignment) => (
              <option key={assignment.idServicioSocio} value={assignment.idServicioSocio}>
                {assignment.socioNombre} - {assignment.servicioNombre}
              </option>
            ))}
          </select>

          <input
            value={form.TipoMedidor}
            onChange={(event) => setForm((prev) => ({ ...prev, TipoMedidor: event.target.value }))}
            className="input-field"
            placeholder="Tipo medidor"
            required
          />

          <input
            type="date"
            value={form.FechaInstalacion}
            onChange={(event) => setForm((prev) => ({ ...prev, FechaInstalacion: event.target.value }))}
            className="input-field"
            required
          />

          <div className="flex gap-2">
            <button type="submit" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              {editingMeterId ? 'Guardar cambios' : 'Instalar'}
            </button>
            {editingMeterId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingMeterId(null)
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
                <th className="px-4 py-3">Numero</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Instalacion</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {meters.map((meter) => (
                <tr key={meter.idMedidor} className="border-t border-gray-100">
                  <td className="px-4 py-4 font-semibold text-gray-900">{meter.NumeroMedidor}</td>
                  <td className="px-4 py-4">{meter.socioNombre}</td>
                  <td className="px-4 py-4">{meter.servicioNombre}</td>
                  <td className="px-4 py-4">{meter.TipoMedidor}</td>
                  <td className="px-4 py-4">{formatDate(meter.FechaInstalacion, 'es-AR')}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meter.Estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {meter.Estado}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMeterId(meter.idMedidor)
                          setForm({
                            idServicioSocio: String(meter.idServicioSocio || ''),
                            TipoMedidor: meter.TipoMedidor,
                            FechaInstalacion: String(meter.FechaInstalacion).slice(0, 10)
                          })
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleMeterStatus(meter.idMedidor)
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
              ))}
            </tbody>
          </table>

          {!meters.length ? (
            <div className="py-12 text-center text-gray-500">Todavia no hay medidores instalados.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
