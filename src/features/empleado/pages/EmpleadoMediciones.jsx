import React, { useEffect, useMemo, useState } from 'react'
import { History, Search, Save } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { formatDate } from '@/utils/formatDate.js'

const initialForm = {
  idMedidor: '',
  TipoLectura: 'Manual',
  FechaLectura: '',
  LecturaActual: ''
}

export default function EmpleadoMediciones() {
  const addNotification = useAppStore((state) => state.addNotification)
  const empleadoUsuario = useAuthStore((state) => state.usuario)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchMeasurementsByMeter = useServiceWorkflowStore((state) => state.fetchMeasurementsByMeter)
  const createMeasurement = useServiceWorkflowStore((state) => state.createMeasurement)

  const [search, setSearch] = useState('')
  const [meters, setMeters] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    fetchMeters().then((data) => {
      const activeMeters = data.filter((meter) => meter.Estado === 'Activo')
      setMeters(activeMeters)
      if (activeMeters.length) {
        setForm((prev) => ({
          ...prev,
          idMedidor: String(activeMeters[0].idMedidor),
          FechaLectura: new Date().toISOString().slice(0, 10)
        }))
      }
    })
  }, [fetchMeters])

  useEffect(() => {
    if (!form.idMedidor) return
    fetchMeasurementsByMeter(form.idMedidor).then(setHistory)
  }, [fetchMeasurementsByMeter, form.idMedidor])

  const filteredMeters = useMemo(() => {
    const query = search.toLowerCase()
    return meters.filter((meter) =>
      [meter.NumeroMedidor, meter.socioNombre, meter.servicioNombre].join(' ').toLowerCase().includes(query)
    )
  }, [meters, search])

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await createMeasurement({
        idMedidor: Number(form.idMedidor),
        TipoLectura: form.TipoLectura,
        FechaLectura: form.FechaLectura,
        LecturaActual: Number(form.LecturaActual),
        EmpleadoUsuario: empleadoUsuario
      })

      addNotification({
        title: 'Medicion guardada',
        message: 'La lectura se registro correctamente.',
        type: 'success'
      })

      setForm((prev) => ({ ...prev, LecturaActual: '' }))
      fetchMeasurementsByMeter(form.idMedidor).then(setHistory)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo guardar la medicion.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cargar Mediciones</h1>
        <p className="mt-2 text-gray-600">Busca un medidor, registra la lectura y revisa el historial.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar medidor o socio..."
              className="w-full text-sm outline-none"
            />
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto">
            {filteredMeters.map((meter) => (
              <button
                key={meter.idMedidor}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, idMedidor: String(meter.idMedidor) }))}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  String(form.idMedidor) === String(meter.idMedidor)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                <p className="text-sm text-gray-600">{meter.socioNombre}</p>
                <p className="text-xs text-gray-500">{meter.servicioNombre}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Nueva lectura</h2>

            <select
              value={form.idMedidor}
              onChange={(event) => setForm((prev) => ({ ...prev, idMedidor: event.target.value }))}
              className="input-field"
              required
            >
              <option value="">Seleccionar medidor...</option>
              {meters.map((meter) => (
                <option key={meter.idMedidor} value={meter.idMedidor}>
                  {meter.NumeroMedidor} - {meter.socioNombre}
                </option>
              ))}
            </select>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.TipoLectura}
                onChange={(event) => setForm((prev) => ({ ...prev, TipoLectura: event.target.value }))}
                className="input-field"
              >
                <option value="Manual">Manual</option>
                <option value="Control">Control</option>
                <option value="Relevamiento">Relevamiento</option>
              </select>
              <input
                type="date"
                value={form.FechaLectura}
                onChange={(event) => setForm((prev) => ({ ...prev, FechaLectura: event.target.value }))}
                className="input-field"
                required
              />
            </div>

            <input
              type="number"
              min="0"
              value={form.LecturaActual}
              onChange={(event) => setForm((prev) => ({ ...prev, LecturaActual: event.target.value }))}
              className="input-field"
              placeholder="Lectura actual"
              required
            />

            <button type="submit" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              Guardar medicion
            </button>
          </form>

          <div className="card overflow-x-auto">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Historial del medidor</h2>
            </div>

            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Anterior</th>
                  <th className="px-4 py-3">Actual</th>
                  <th className="px-4 py-3">Consumo</th>
                  <th className="px-4 py-3">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {history.map((measurement) => (
                  <tr key={measurement.idMedicion} className="border-t border-gray-100">
                    <td className="px-4 py-3">{formatDate(measurement.FechaLectura, 'es-AR')}</td>
                    <td className="px-4 py-3">{measurement.LecturaAnterior}</td>
                    <td className="px-4 py-3">{measurement.LecturaActual}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{measurement.Consumo}</td>
                    <td className="px-4 py-3">{measurement.TipoLectura}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!history.length ? (
              <div className="py-10 text-center text-gray-500">Todavia no hay lecturas para este medidor.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
