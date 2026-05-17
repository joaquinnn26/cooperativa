import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, LineChart } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import ConsumptionChart from '@/components/ConsumptionChart.jsx'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'

export default function SocioMediciones() {
  const usuario = useAuthStore((state) => state.usuario)
  const fetchMeasurementsBySocio = useServiceWorkflowStore((state) => state.fetchMeasurementsBySocio)
  const [measurements, setMeasurements] = useState([])

  useEffect(() => {
    fetchMeasurementsBySocio(usuario).then(setMeasurements)
  }, [fetchMeasurementsBySocio, usuario])

  const totalConsumption = useMemo(
    () => measurements.reduce((sum, item) => sum + Number(item.Consumo || 0), 0),
    [measurements]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Mediciones</h1>
        <p className="mt-2 text-gray-600">Historial de lecturas, consumo y evolucion mensual.</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
              <LineChart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Consumo acumulado</p>
              <p className="text-3xl font-bold text-gray-900">{totalConsumption}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lecturas registradas</p>
              <p className="text-3xl font-bold text-gray-900">{measurements.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 card">
        <h2 className="text-xl font-semibold text-gray-900">Consumo mensual</h2>
        <div className="mt-5">
          <ConsumptionChart measurements={measurements} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Medidor</th>
              <th className="px-4 py-3">Lectura anterior</th>
              <th className="px-4 py-3">Lectura actual</th>
              <th className="px-4 py-3">Consumo</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((measurement) => (
              <tr key={measurement.idMedicion} className="border-t border-gray-100">
                <td className="px-4 py-3">{formatDate(measurement.FechaLectura, 'es-AR')}</td>
                <td className="px-4 py-3">{measurement.servicioNombre}</td>
                <td className="px-4 py-3">{measurement.NumeroMedidor}</td>
                <td className="px-4 py-3">{measurement.LecturaAnterior}</td>
                <td className="px-4 py-3">{measurement.LecturaActual}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{measurement.Consumo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!measurements.length ? (
          <div className="py-12 text-center text-gray-500">Todavia no hay mediciones disponibles.</div>
        ) : null}
      </div>
    </div>
  )
}
