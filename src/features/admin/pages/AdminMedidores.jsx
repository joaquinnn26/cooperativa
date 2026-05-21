import React, { useEffect, useMemo, useState } from 'react'
import { Gauge, Plus, Power } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useSocios } from '@/hooks/useSocios.js'
import { formatDate } from '@/utils/formatDate.js'

const initialForm = {
  idServicioSocio: '',
  idTipoMedidor: ''
}

function normalizeServiceName(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function serviceRequiresMeter(nombre) {
  const normalized = normalizeServiceName(nombre)
  return normalized === 'luz' || normalized === 'agua potable'
}

export default function AdminMedidores() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchAllServiceAssignments = useServiceWorkflowStore((state) => state.fetchAllServiceAssignments)
  const createMeter = useServiceWorkflowStore((state) => state.createMeter)
  const toggleMeterStatus = useServiceWorkflowStore((state) => state.toggleMeterStatus)
  const { fetchSocios } = useSocios(false)

  const [meters, setMeters] = useState([])
  const [serviceAssignments, setServiceAssignments] = useState([])
  const [socios, setSocios] = useState([])
  const [form, setForm] = useState(initialForm)

  const loadData = async () => {
    const [metersData, assignmentsData, sociosData] = await Promise.all([fetchMeters(), fetchAllServiceAssignments(), fetchSocios()])
    setMeters(metersData)
    setServiceAssignments(assignmentsData)
    setSocios(sociosData)
  }

  useEffect(() => {
    loadData()
  }, [fetchAllServiceAssignments, fetchMeters, fetchSocios])

  const eligibleAssignments = useMemo(
    () =>
      serviceAssignments.filter(
        (assignment) => {
          if (assignment.estado !== 'Activo') return false
          if (!serviceRequiresMeter(assignment.servicioNombre)) return false

          const socio = socios.find((item) => String(item.idSocio) === String(assignment.idSocio))
          const documento = String(socio?.Persona?.Documento || assignment.socioUsuario || '')

          const alreadyHasMeter = meters.some(
            (meter) =>
              String(meter.socioUsuario || meter.Documento || '') === documento &&
              normalizeServiceName(meter.servicioNombre) === normalizeServiceName(assignment.servicioNombre) &&
              meter.Estado !== 'Inactivo'
          )

          return !alreadyHasMeter
        }
      ),
    [meters, serviceAssignments, socios]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await createMeter({
        idServicioSocio: Number(form.idServicioSocio),
        idTipoMedidor: Number(form.idTipoMedidor)
      })
      addNotification({ title: 'Medidor instalado', message: 'El medidor se creo correctamente.', type: 'success' })
      setForm(initialForm)
      await loadData()
    } catch (error) {
      addNotification({ title: 'Error', message: error.message || 'No se pudo guardar el medidor.', type: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion medidores</h1>
          <p className="mt-2 text-gray-600">Instala medidores sobre servicios aprobados y administra su estado.</p>
        </div>
        <div className="rounded-full bg-amber-100 p-3 text-amber-700">
          <Gauge className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Instalar medidor</h2>
          <p className="text-sm text-gray-500">Solo los servicios de Luz y Agua Potable requieren medidor.</p>

          <select
            value={form.idServicioSocio}
            onChange={(event) => setForm((prev) => ({ ...prev, idServicioSocio: event.target.value }))}
            className="input-field"
            required
          >
            <option value="">Seleccionar servicio aprobado...</option>
            {eligibleAssignments.map((assignment) => (
              <option key={assignment.idServicioSocio} value={assignment.idServicioSocio}>
                {assignment.socioNombre} - {assignment.servicioNombre}
              </option>
            ))}
          </select>

          {!eligibleAssignments.length ? (
            <p className="text-sm text-amber-700">
              No hay servicios de Luz o Agua Potable pendientes de instalacion de medidor.
            </p>
          ) : null}

          <input
            type="number"
            min="1"
            value={form.idTipoMedidor}
            onChange={(event) => setForm((prev) => ({ ...prev, idTipoMedidor: event.target.value }))}
            className="input-field"
            placeholder="Id tipo medidor"
            required
          />

          <button type="submit" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Instalar
          </button>
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

          {!meters.length ? <div className="py-12 text-center text-gray-500">Todavia no hay medidores instalados.</div> : null}
        </div>
      </div>
    </div>
  )
}
