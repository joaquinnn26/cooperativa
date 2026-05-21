import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, LineChart } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import ConsumptionChart from '@/components/ConsumptionChart.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'

export default function SocioMediciones() {
  const PAGE_SIZE = 6
  const { socioId } = useCurrentSocio()
  const fetchMeasurementsBySocio = useServiceWorkflowStore((state) => state.fetchMeasurementsBySocio)
  const [measurements, setMeasurements] = useState([])
  const [selectedService, setSelectedService] = useState('todos')
  const [selectedMeter, setSelectedMeter] = useState('todos')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!socioId) return
    fetchMeasurementsBySocio(socioId).then(setMeasurements)
  }, [fetchMeasurementsBySocio, socioId])

  const serviceOptions = useMemo(
    () =>
      Array.from(new Set(measurements.map((item) => item.servicioNombre).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b))
      ),
    [measurements]
  )

  const meterOptions = useMemo(() => {
    const filteredByService =
      selectedService === 'todos'
        ? measurements
        : measurements.filter((item) => item.servicioNombre === selectedService)

    return Array.from(new Set(filteredByService.map((item) => item.NumeroMedidor).filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b))
    )
  }, [measurements, selectedService])

  const filteredMeasurements = useMemo(() => {
    return measurements.filter((item) => {
      const matchesService = selectedService === 'todos' || item.servicioNombre === selectedService
      const matchesMeter = selectedMeter === 'todos' || item.NumeroMedidor === selectedMeter
      return matchesService && matchesMeter
    })
  }, [measurements, selectedMeter, selectedService])

  useEffect(() => {
    if (selectedService !== 'todos' && !serviceOptions.includes(selectedService)) {
      setSelectedService('todos')
    }
  }, [selectedService, serviceOptions])

  useEffect(() => {
    if (selectedMeter !== 'todos' && !meterOptions.includes(selectedMeter)) {
      setSelectedMeter('todos')
    }
  }, [meterOptions, selectedMeter])

  useEffect(() => {
    setPage(1)
  }, [selectedMeter, selectedService])

  const totalConsumption = useMemo(
    () => filteredMeasurements.reduce((sum, item) => sum + Number(item.Consumo || 0), 0),
    [filteredMeasurements]
  )

  const byService = useMemo(() => {
    return filteredMeasurements.reduce((acc, item) => {
      const key = item.servicioNombre || 'Servicio'
      acc[key] = (acc[key] || 0) + Number(item.Consumo || 0)
      return acc
    }, {})
  }, [filteredMeasurements])

  const totalPages = Math.max(1, Math.ceil(filteredMeasurements.length / PAGE_SIZE))

  const paginatedMeasurements = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredMeasurements.slice(start, start + PAGE_SIZE)
  }, [filteredMeasurements, page])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Mediciones</h1>
        <p className="mt-2 text-gray-600">Historial de lecturas, consumo y evolucion mensual.</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <select
          value={selectedService}
          onChange={(event) => setSelectedService(event.target.value)}
          className="input-field"
        >
          <option value="todos">Todos los servicios</option>
          {serviceOptions.map((serviceName) => (
            <option key={serviceName} value={serviceName}>
              {serviceName}
            </option>
          ))}
        </select>

        <select
          value={selectedMeter}
          onChange={(event) => setSelectedMeter(event.target.value)}
          className="input-field"
        >
          <option value="todos">Todos los medidores</option>
          {meterOptions.map((meterNumber) => (
            <option key={meterNumber} value={meterNumber}>
              {meterNumber}
            </option>
          ))}
        </select>
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
              <p className="text-3xl font-bold text-gray-900">{filteredMeasurements.length}</p>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(byService).length ? (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {Object.entries(byService).map(([serviceName, consumption]) => (
            <div key={serviceName} className="card">
              <p className="text-sm text-gray-500">{serviceName}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{consumption}</p>
              <p className="text-xs text-gray-500">Consumo acumulado por servicio</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-8 card">
        <h2 className="text-xl font-semibold text-gray-900">Consumo mensual</h2>
        <div className="mt-5">
          <ConsumptionChart measurements={filteredMeasurements} />
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
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Registrada por</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMeasurements.map((measurement) => (
              <tr key={measurement.idMedicion} className="border-t border-gray-100">
                <td className="px-4 py-3">{formatDate(measurement.FechaLectura, 'es-AR')}</td>
                <td className="px-4 py-3">{measurement.servicioNombre}</td>
                <td className="px-4 py-3">{measurement.NumeroMedidor}</td>
                <td className="px-4 py-3">{measurement.LecturaAnterior}</td>
                <td className="px-4 py-3">{measurement.LecturaActual}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{measurement.Consumo}</td>
                <td className="px-4 py-3">{measurement.TipoLectura}</td>
                <td className="px-4 py-3">{measurement.EmpleadoUsuario || 'No informado'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filteredMeasurements.length ? (
          <div className="py-12 text-center text-gray-500">Todavia no hay mediciones disponibles.</div>
        ) : null}

        {filteredMeasurements.length ? (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Pagina {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
