import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import useAppStore from '@/store/appStore.js'
import { crearTurno } from '../TurnosService'

export default function TurnoNuevo() {
  const { socioId, loadingSocio, resolveSocioId } = useCurrentSocio()
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()

  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!fecha || !hora || !motivo.trim()) {
      addNotification({
        title: 'Faltan datos',
        message: 'Completa fecha, hora y motivo del turno',
        type: 'error'
      })
      return
    }

    setIsLoading(true)

    try {
      const resolvedSocioId = socioId ?? (await resolveSocioId())

      if (!resolvedSocioId) {
        throw new Error('No se pudo identificar el socio logueado')
      }

      await crearTurno({
        idSocio: resolvedSocioId,
        IdSocio: resolvedSocioId,
        fecha,
        Fecha: fecha,
        hora,
        Hora: hora,
        motivo: motivo.trim(),
        Motivo: motivo.trim(),
        estadoTurnoId: 1,
        idEstadoTurno: 1,
        IdEstadoTurno: 1
      })

      addNotification({
        title: 'Turno solicitado',
        message: 'Tu solicitud quedo pendiente de aprobacion',
        type: 'success'
      })

      setFecha('')
      setHora('')
      setMotivo('')
      navigate('/socio')
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo registrar el turno',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackToSocioDashboard />
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Solicitar Nuevo Turno</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Escribe el motivo del turno"
              rows={4}
              required
              className="input-field"
              disabled={isLoading}
            />
          </div>

          {loadingSocio ? (
            <p className="text-sm text-gray-500">Identificando socio actual...</p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || loadingSocio || !socioId}
            className="inline-flex items-center btn-primary px-6 py-3 disabled:opacity-50"
          >
            <CalendarPlus className="w-5 h-5 mr-2" />
            {isLoading ? 'Enviando...' : 'Confirmar Solicitud de Turno'}
          </button>
        </form>
      </div>
    </div>
  )
}
