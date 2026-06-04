import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarDays, Clock3, Loader2, Send } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import { crearTurno, obtenerDisponibilidadTurnos } from '../TurnosService.js'
import {
  DEFAULT_AVAILABILITY_DAYS,
  formatDateLabel,
  formatDateLong
} from '../turnosUtils.js'

const MOTIVE_TYPES = [
  'Consulta administrativa',
  'Facturacion o pagos',
  'Reclamo presencial',
  'Entrega de documentacion',
  'Otro motivo'
]

export default function TurnoNuevo() {
  const { socioId, loadingSocio, resolveSocioId } = useCurrentSocio()
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()

  const [availability, setAvailability] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [motivoTipo, setMotivoTipo] = useState(MOTIVE_TYPES[0])
  const [motivoDetalle, setMotivoDetalle] = useState('')
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadAvailability() {
      setLoadingAvailability(true)

      try {
        const data = await obtenerDisponibilidadTurnos({ dias: DEFAULT_AVAILABILITY_DAYS })
        if (cancelled) return

        setAvailability(data)
        const firstAvailableDay = data.find((day) => day.horarios.length)
        setSelectedDate(firstAvailableDay?.fecha || '')
        setSelectedTime(firstAvailableDay?.horarios[0] || '')
      } catch (error) {
        if (cancelled) return
        console.error('Error al cargar disponibilidad de turnos', error)
        addNotification({
          title: 'Error',
          message: error.message || 'No se pudo cargar la disponibilidad de turnos.',
          type: 'error'
        })
      } finally {
        if (!cancelled) setLoadingAvailability(false)
      }
    }

    loadAvailability()

    return () => {
      cancelled = true
    }
  }, [addNotification])

  const selectedDay = useMemo(
    () => availability.find((day) => day.fecha === selectedDate),
    [availability, selectedDate]
  )
  const motivoFinal = `${motivoTipo}: ${motivoDetalle.trim()}`
  const canSubmit = Boolean(selectedDate && selectedTime && motivoDetalle.trim())

  const handleDateSelect = (day) => {
    if (!day.horarios.length) return
    setSelectedDate(day.fecha)
    setSelectedTime(day.horarios[0])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSubmit) {
      addNotification({
        title: 'Faltan datos',
        message: 'Selecciona dia, horario y razon del turno.',
        type: 'error'
      })
      return
    }

    setIsLoading(true)

    try {
      const resolvedSocioId = socioId ?? (await resolveSocioId())

      if (!resolvedSocioId) {
        throw new Error('No se pudo identificar el socio logueado.')
      }

      await crearTurno({
        idSocio: Number(resolvedSocioId),
        IdSocio: Number(resolvedSocioId),
        socioNombre: nombre || usuario || `Socio ${resolvedSocioId}`,
        SocioNombre: nombre || usuario || `Socio ${resolvedSocioId}`,
        socioDocumento: usuario || '',
        SocioDocumento: usuario || '',
        fecha: selectedDate,
        Fecha: selectedDate,
        hora: selectedTime,
        Hora: selectedTime,
        motivo: motivoFinal,
        Motivo: motivoFinal,
        estadoTurnoId: 1,
        idEstadoTurno: 1,
        IdEstadoTurno: 1
      })

      addNotification({
        title: 'Turno solicitado',
        message: 'Tu turno quedo pendiente de aprobacion.',
        type: 'success'
      })

      navigate('/socio/turnos')
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo registrar el turno.',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitar visita presencial</h1>
          <p className="mt-2 text-gray-600">Reserva un turno con atencion administrativa en la cooperativa.</p>
        </div>
        <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
          <CalendarCheck className="h-6 w-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Dias disponibles</h2>
          </div>

          {loadingAvailability ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando disponibilidad...
            </div>
          ) : availability.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availability.map((day) => {
                const active = selectedDate === day.fecha

                return (
                  <button
                    key={day.fecha}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={!day.horarios.length}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : day.horarios.length
                          ? 'border-gray-200 bg-white text-gray-800 hover:border-blue-200 hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span className="block text-sm font-semibold capitalize">{formatDateLabel(day.fecha)}</span>
                    <span className="mt-1 block text-xs">
                      {day.horarios.length ? `${day.horarios.length} horarios` : 'Sin horarios'}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-500">
              No hay turnos disponibles desde la fecha actual.
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Horarios</h2>
            </div>

            {selectedDay?.horarios?.length ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {selectedDay.horarios.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      selectedTime === slot
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                Selecciona un dia con horarios disponibles.
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Razon</label>
              <select
                value={motivoTipo}
                onChange={(event) => setMotivoTipo(event.target.value)}
                className="input-field"
                disabled={isLoading}
              >
                {MOTIVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Detalle</label>
              <textarea
                value={motivoDetalle}
                onChange={(event) => setMotivoDetalle(event.target.value)}
                placeholder="Ej: consulta por factura, alta de tramite, documentacion pendiente..."
                rows={4}
                required
                className="input-field"
                disabled={isLoading}
              />
            </div>
          </div>

          {loadingSocio ? <p className="text-sm text-gray-500">Identificando socio actual...</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || loadingSocio || loadingAvailability || !canSubmit}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="mr-2 h-5 w-5" />
              {isLoading ? 'Enviando...' : 'Solicitar turno'}
            </button>
          </div>
        </div>

        <aside className="card h-fit space-y-5">
          <div>
            <p className="text-sm text-gray-500">Turno seleccionado</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {selectedDate ? formatDateLong(selectedDate) : 'Sin dia seleccionado'}
            </h2>
            <p className="mt-2 text-lg font-semibold text-blue-700">
              {selectedTime ? `${selectedTime} hs` : 'Sin horario'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase text-gray-500">Estado inicial</p>
            <p className="mt-1 font-semibold text-gray-900">Pendiente de aprobacion</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase text-gray-500">Razon</p>
            <p className="mt-1 text-sm text-gray-700">
              {motivoDetalle.trim() ? motivoFinal : 'Todavia no completaste el detalle.'}
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
