import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Clock3, FileText, PlusCircle } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import useAppStore from '@/store/appStore.js'
import { aceptarPropuestaBackend, obtenerTurnosPorSocio } from '../TurnosService.js'
import {
  compareTurnos,
  formatDateLong,
  normalizeText,
  normalizeTurno,
  statusStyles
} from '../turnosUtils.js'

function canAcceptProposal(turno) {
  return normalizeText(turno.estado).startsWith('propuest') && turno.fechaPropuesta && turno.horaPropuesta
}

export default function MisTurnos() {
  const { socioId, loadingSocio, resolveSocioId } = useCurrentSocio()
  const addNotification = useAppStore((state) => state.addNotification)
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const loadTurnos = async () => {
    setLoading(true)

    try {
      const resolvedSocioId = socioId ?? (await resolveSocioId())
      if (!resolvedSocioId) throw new Error('No se pudo identificar el socio actual.')

      const datos = await obtenerTurnosPorSocio(resolvedSocioId)
      setTurnos((datos || []).map(normalizeTurno).sort(compareTurnos))
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar tus turnos.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTurnos()
  }, [socioId])

  const summary = useMemo(
    () => ({
      total: turnos.length,
      pending: turnos.filter((turno) => ['pendiente', 'propuesto'].includes(normalizeText(turno.estado))).length,
      confirmed: turnos.filter((turno) =>
        ['aprobado', 'aprobada', 'aceptado', 'aceptada'].includes(normalizeText(turno.estado))
      ).length
    }),
    [turnos]
  )

  const handleAcceptProposal = async (turno) => {
    setUpdatingId(turno.id)

    try {
      await aceptarPropuestaBackend(turno.id)
      addNotification({
        title: 'Horario aceptado',
        message: 'El turno quedo confirmado con la propuesta del administrador.',
        type: 'success'
      })
      await loadTurnos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aceptar la propuesta.',
        type: 'error'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading || loadingSocio) {
    return <div className="mt-10 text-center text-gray-500">Cargando turnos...</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis turnos presenciales</h1>
          <p className="mt-2 text-gray-600">Consulta tus solicitudes y responde propuestas de horario.</p>
        </div>
        <Link
          to="/socio/turnos/nuevo"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo turno
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Confirmados</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.confirmed}</p>
        </div>
      </div>

      <div className="space-y-4">
        {turnos.map((turno) => (
          <div key={turno.id} className="card">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold capitalize text-gray-900">
                      {formatDateLong(turno.fecha)} - {turno.hora} hs
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">{turno.motivo}</p>
                  </div>
                </div>

                {turno.fechaPropuesta && turno.horaPropuesta ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-xs uppercase text-blue-700">Propuesta del administrador</p>
                    <p className="mt-1 font-semibold capitalize text-gray-900">
                      {formatDateLong(turno.fechaPropuesta)} - {turno.horaPropuesta} hs
                    </p>
                    {turno.observacionAdmin ? (
                      <p className="mt-2 text-sm text-gray-600">{turno.observacionAdmin}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 lg:min-w-52 lg:items-end">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(turno.estado)}`}>
                  {turno.estado}
                </span>

                {canAcceptProposal(turno) ? (
                  <button
                    type="button"
                    onClick={() => handleAcceptProposal(turno)}
                    disabled={updatingId === turno.id}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {updatingId === turno.id ? 'Aceptando...' : 'Aceptar horario'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {!turnos.length ? (
          <div className="card py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">No tenes turnos registrados.</p>
            <p className="mt-2 text-gray-500">Cuando solicites uno, vas a verlo aca con su estado.</p>
            <Link
              to="/socio/turnos/nuevo"
              className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Solicitar turno
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
