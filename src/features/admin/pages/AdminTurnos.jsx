import React, { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  Send,
  X,
  XCircle
} from 'lucide-react'
import { useAdminTurnos } from '@/hooks/useAdminTurnos.jsx'
import { useTurnos } from '@/hooks/useTurnos.jsx'
import useAppStore from '@/store/appStore.js'
import { confirmAction } from '@/utils/alerts.js'
import {
  DIAS_DISPONIBILIDAD_TURNOS,
  HORARIOS_TURNOS,
  compararTurnos,
  compararTurnosRecientes,
  estilosEstadoTurno,
  formatearFechaCorta,
  formatearFechaLarga,
  limpiarTextoPlano,
  normalizarTexto,
  normalizarTurno
} from '@/utils/turnosUtils.jsx'
import { firstValidationError, isTodayOrFuture } from '@/utils/validation.js'

const FILTROS_ESTADO = ['Todos', 'Pendiente', 'Propuesto', 'Aprobado', 'Aceptado', 'Rechazado', 'Cancelado']
const CANTIDAD_POR_PAGINA = 6
const MINIMO_CARACTERES_RECHAZO = 10
const MAXIMO_CARACTERES_RECHAZO = 300
const OPCIONES_ORDEN = [
  { value: 'recientes', label: 'Mas recientes primero' },
  { value: 'viejos', label: 'Mas viejos primero' }
]

function claveEstado(estado) {
  const estadoNormalizado = normalizarTexto(estado)
  if (estadoNormalizado.startsWith('aprobad')) return 'aprobado'
  if (estadoNormalizado.startsWith('aceptad')) return 'aceptado'
  if (estadoNormalizado.startsWith('rechazad')) return 'rechazado'
  if (estadoNormalizado.startsWith('cancelad')) return 'cancelado'
  if (estadoNormalizado.startsWith('propuest')) return 'propuesto'
  return estadoNormalizado
}

function estaPendiente(estado) {
  return claveEstado(estado) === 'pendiente'
}

function esEstadoAbierto(estado) {
  return ['pendiente', 'propuesto'].includes(claveEstado(estado))
}

export default function AdminTurnos() {
  const addNotification = useAppStore((state) => state.addNotification)
  const { obtenerDisponibilidadTurnos } = useTurnos()
  const { actualizarEstadoTurno, obtenerTodosLosTurnos } = useAdminTurnos()
  const [turnos, setTurnos] = useState([])
  const [disponibilidad, setDisponibilidad] = useState([])
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [idActualizando, setIdActualizando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [ordenTurnos, setOrdenTurnos] = useState('recientes')
  const [paginaActual, setPaginaActual] = useState(1)
  const [idProponiendo, setIdProponiendo] = useState(null)
  const [turnoRechazando, setTurnoRechazando] = useState(null)
  const [modalAgendaAbierta, setModalAgendaAbierta] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [formularioPropuesta, setFormularioPropuesta] = useState({
    fechaPropuesta: '',
    horaPropuesta: ''
  })

  const cargarDatos = async () => {
    setCargando(true)

    try {
      const datos = await obtenerTodosLosTurnos()
      const turnosNormalizados = (datos || []).map(normalizarTurno)

      setTurnos(turnosNormalizados)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar los turnos.',
        type: 'error'
      })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const resumen = useMemo(
    () => ({
      total: turnos.length,
      pendientes: turnos.filter((turno) => estaPendiente(turno.estado)).length,
      propuestos: turnos.filter((turno) => claveEstado(turno.estado) === 'propuesto').length,
      confirmados: turnos.filter((turno) => ['aprobado', 'aceptado'].includes(claveEstado(turno.estado))).length
    }),
    [turnos]
  )

  const turnosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase()
    const claveFiltro = filtroEstado === 'Todos' ? '' : claveEstado(filtroEstado)

    const turnosCoincidentes = turnos.filter((turno) => {
      const coincideEstado = !claveFiltro || claveEstado(turno.estado) === claveFiltro
      const textoBuscable = [
        turno.socio,
        turno.documentoSocio,
        turno.fecha,
        turno.hora,
        turno.fechaPropuesta,
        turno.horaPropuesta,
        turno.motivo,
        turno.motivoRechazo,
        turno.observacionAdmin,
        turno.estado
      ]
        .join(' ')
        .toLowerCase()

      return coincideEstado && (!textoBusqueda || textoBuscable.includes(textoBusqueda))
    })

    return [...turnosCoincidentes].sort(ordenTurnos === 'recientes' ? compararTurnosRecientes : compararTurnos)
  }, [busqueda, filtroEstado, ordenTurnos, turnos])

  const totalPaginas = Math.max(1, Math.ceil(turnosFiltrados.length / CANTIDAD_POR_PAGINA))
  const turnosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * CANTIDAD_POR_PAGINA
    return turnosFiltrados.slice(inicio, inicio + CANTIDAD_POR_PAGINA)
  }, [paginaActual, turnosFiltrados])

  const turnoEnPropuesta = useMemo(
    () => turnos.find((turno) => turno.id === idProponiendo) || null,
    [idProponiendo, turnos]
  )

  const diaPropuestaSeleccionado = useMemo(
    () => disponibilidad.find((dia) => dia.fecha === formularioPropuesta.fechaPropuesta),
    [disponibilidad, formularioPropuesta.fechaPropuesta]
  )

  const turnosUrgentes = useMemo(
    () => turnos.filter((turno) => ['pendiente', 'propuesto'].includes(claveEstado(turno.estado))),
    [turnos]
  )

  const proximoTurno = useMemo(
    () =>
      [...turnos]
        .filter((turno) => ['pendiente', 'propuesto', 'aprobado', 'aceptado'].includes(claveEstado(turno.estado)))
        .sort((turnoA, turnoB) => `${turnoA.fecha || ''} ${turnoA.hora || ''}`.localeCompare(`${turnoB.fecha || ''} ${turnoB.hora || ''}`))[0] || null,
    [turnos]
  )

  const agendaConfirmada = useMemo(() => {
    const turnosConfirmados = turnos
      .filter((turno) => ['aprobado', 'aceptado'].includes(claveEstado(turno.estado)))
      .sort(compararTurnos)

    return Array.from(
      turnosConfirmados.reduce((agenda, turno) => {
        const fecha = turno.fechaPropuesta || turno.fecha
        const hora = turno.horaPropuesta || turno.hora

        if (!fecha) return agenda
        if (!agenda.has(fecha)) agenda.set(fecha, [])
        agenda.get(fecha).push({ ...turno, fechaAgenda: fecha, horaAgenda: hora })
        return agenda
      }, new Map())
    ).map(([fecha, turnosDelDia]) => ({
      fecha,
      turnos: turnosDelDia.sort((turnoA, turnoB) =>
        String(turnoA.horaAgenda || '').localeCompare(String(turnoB.horaAgenda || ''))
      )
    }))
  }, [turnos])

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroEstado, ordenTurnos])

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas)
  }, [paginaActual, totalPaginas])

  const abrirPropuesta = async (turno) => {
    setIdProponiendo(turno.id)
    setDisponibilidad([])
    setFormularioPropuesta({
      fechaPropuesta: '',
      horaPropuesta: ''
    })

    setCargandoDisponibilidad(true)
    try {
      const datosDisponibilidad = await obtenerDisponibilidadTurnos({
        dias: DIAS_DISPONIBILIDAD_TURNOS,
        turnosBase: turnos
      })
      const primerDiaConHorario = datosDisponibilidad.find((dia) => dia.horarios.length)

      setDisponibilidad(datosDisponibilidad)
      setFormularioPropuesta((formularioAnterior) => ({
        ...formularioAnterior,
        fechaPropuesta: primerDiaConHorario?.fecha || '',
        horaPropuesta: primerDiaConHorario?.horarios[0] || ''
      }))
    } catch (error) {
      addNotification({
        title: 'Horarios no disponibles',
        message: error.message || 'No se pudieron cargar los horarios disponibles.',
        type: 'error'
      })
    } finally {
      setCargandoDisponibilidad(false)
    }
  }

  const manejarAprobacion = async (turno) => {
    const confirmado = await confirmAction({
      title: 'Aprobar turno',
      message: `Vas a aprobar el turno de ${turno.socio || 'este socio'} para ${formatearFechaLarga(turno.fecha)} a las ${turno.hora} hs.`,
      confirmButtonText: 'Aprobar',
      type: 'question'
    })

    if (!confirmado) return

    setIdActualizando(turno.id)

    try {
      await actualizarEstadoTurno(turno.id, 2)
      addNotification({
        title: 'Turno aprobado',
        message: `El turno de ${turno.socio || 'socio'} quedo aprobado.`,
        type: 'success'
      })
      await cargarDatos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aprobar el turno.',
        type: 'error'
      })
    } finally {
      setIdActualizando(null)
    }
  }

  const manejarPropuesta = async (turno) => {
    const validationError = firstValidationError([
      !isTodayOrFuture(formularioPropuesta.fechaPropuesta) ? 'Selecciona un dia valido de hoy o posterior.' : '',
      !HORARIOS_TURNOS.includes(formularioPropuesta.horaPropuesta) ? 'Selecciona un horario valido de la agenda.' : '',
      !diaPropuestaSeleccionado?.horarios?.includes(formularioPropuesta.horaPropuesta)
        ? 'El horario seleccionado ya no esta disponible para ese dia.'
        : ''
    ])

    if (validationError) {
      addNotification({
        title: 'Faltan datos',
        message: validationError,
        type: 'error'
      })
      return
    }

    setIdActualizando(turno.id)

    try {
      await actualizarEstadoTurno(turno.id, 3, {
        fechaPropuesta: formularioPropuesta.fechaPropuesta,
        FechaPropuesta: formularioPropuesta.fechaPropuesta,
        horaPropuesta: formularioPropuesta.horaPropuesta,
        HoraPropuesta: formularioPropuesta.horaPropuesta
      })

      addNotification({
        title: 'Propuesta enviada',
        message: `Se propuso otro horario para ${turno.socio || 'el socio'}.`,
        type: 'success'
      })

      setIdProponiendo(null)
      await cargarDatos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo proponer otro horario.',
        type: 'error'
      })
    } finally {
      setIdActualizando(null)
    }
  }

  const manejarRechazo = async (turno) => {
    setTurnoRechazando(turno)
    setMotivoRechazo('')
  }

  const cerrarRechazo = () => {
    setTurnoRechazando(null)
    setMotivoRechazo('')
  }

  const confirmarRechazo = async () => {
    const turno = turnoRechazando
    if (!turno) return

    const motivoLimpio = limpiarTextoPlano(motivoRechazo)
    const validationError = firstValidationError([
      motivoLimpio.length < MINIMO_CARACTERES_RECHAZO
        ? `El motivo de rechazo debe tener al menos ${MINIMO_CARACTERES_RECHAZO} caracteres.`
        : '',
      motivoLimpio.length > MAXIMO_CARACTERES_RECHAZO
        ? `El motivo de rechazo no puede superar ${MAXIMO_CARACTERES_RECHAZO} caracteres.`
        : ''
    ])

    if (validationError) {
      addNotification({
        title: 'Motivo invalido',
        message: validationError,
        type: 'error'
      })
      return
    }

    setIdActualizando(turno.id)

    try {
      await actualizarEstadoTurno(turno.id, 4, {
        motivoRechazo: motivoLimpio,
        MotivoRechazo: motivoLimpio,
        observacionAdmin: motivoLimpio,
        ObservacionAdmin: motivoLimpio
      })

      addNotification({
        title: 'Turno rechazado',
        message: `El turno de ${turno.socio || 'socio'} quedo rechazado.`,
        type: 'success'
      })

      cerrarRechazo()
      await cargarDatos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo rechazar el turno.',
        type: 'error'
      })
    } finally {
      setIdActualizando(null)
    }
  }

  if (cargando) {
    return <div className="mt-10 text-center text-gray-500">Cargando turnos de la cooperativa...</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-600">Atencion presencial</p>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de turnos presenciales</h1>
          <p className="mt-2 text-gray-600">Prioriza solicitudes pendientes, responde propuestas y confirma horarios.</p>
        </div>
        <div className="flex flex-wrap items-stretch gap-3">
          <button
            type="button"
            onClick={() => setModalAgendaAbierta(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <CalendarDays className="mr-2 h-5 w-5" />
            Ver agenda aprobada
          </button>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900">
            <p className="text-xs font-semibold uppercase text-blue-700">Bandeja abierta</p>
            <p className="mt-1 text-2xl font-bold">{turnosUrgentes.length}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Total de turnos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{resumen.total}</p>
            </div>
            <span className="rounded-lg bg-gray-100 p-2 text-gray-700">
              <CalendarCheck className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-amber-800">Pendientes</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{resumen.pendientes}</p>
            </div>
            <span className="rounded-lg bg-white/80 p-2 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-blue-800">Propuestos</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{resumen.propuestos}</p>
            </div>
            <span className="rounded-lg bg-white/80 p-2 text-blue-700">
              <Send className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-800">Confirmados</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{resumen.confirmados}</p>
            </div>
            <span className="rounded-lg bg-white/80 p-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bandeja de turnos</h2>
              <p className="mt-1 text-sm text-gray-500">
                {turnosUrgentes.length
                  ? `${turnosUrgentes.length} turno${turnosUrgentes.length === 1 ? '' : 's'} necesitan respuesta.`
                  : 'No hay turnos pendientes de respuesta.'}
              </p>
            </div>
            <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {turnosFiltrados.length} visibles
            </span>
          </div>
        </div>

        <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">Filtros y orden</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar socio, documento, motivo..."
                className="w-full min-w-0 text-sm outline-none"
              />
            </label>
            <select
              value={ordenTurnos}
              onChange={(evento) => setOrdenTurnos(evento.target.value)}
              className="input-field"
              aria-label="Ordenar turnos"
            >
              {OPCIONES_ORDEN.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
              className="input-field"
            >
              {FILTROS_ESTADO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === 'Todos' ? 'Todos los estados' : estado}
                </option>
              ))}
            </select>
          </div>
        </div>

        {proximoTurno ? (
          <div className="mx-5 mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-blue-700">Proximo turno en agenda</p>
            <p className="mt-1 font-semibold text-gray-900">
              {proximoTurno.socio || `Socio ${proximoTurno.idSocio}`} - {formatearFechaLarga(proximoTurno.fecha)} a las {proximoTurno.hora} hs
            </p>
          </div>
        ) : null}

        <div className="space-y-3 px-5 py-5">
          {turnosPaginados.map((turno) => {
            const estado = claveEstado(turno.estado)
            const necesitaDecision = estaPendiente(turno.estado)
            const estaPropuesto = estado === 'propuesto'

            return (
              <article
                key={turno.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${
                  necesitaDecision
                    ? 'border-amber-200'
                    : estaPropuesto
                      ? 'border-blue-200'
                      : 'border-gray-200'
                }`}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`rounded-lg p-2 ${necesitaDecision ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          <CalendarClock className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">{turno.socio || `Socio ${turno.idSocio}`}</h3>
                          <p className="text-sm text-gray-500">
                            {turno.documentoSocio ? `Doc. ${turno.documentoSocio}` : `ID socio ${turno.idSocio || '-'}`}
                          </p>
                        </div>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${estilosEstadoTurno(turno.estado)}`}>
                        {turno.estado}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="rounded-lg bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">Solicitado</p>
                        <p className="mt-1 font-semibold capitalize text-gray-900">
                          {formatearFechaLarga(turno.fecha)}
                        </p>
                        <p className="text-sm text-gray-600">{turno.hora} hs</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">Motivo</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{turno.motivo || 'Sin motivo informado'}</p>
                      </div>
                    </div>

                    {turno.fechaPropuesta && turno.horaPropuesta ? (
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-blue-700">Propuesta enviada al socio</p>
                        <p className="mt-1 font-semibold capitalize text-gray-900">
                          {formatearFechaLarga(turno.fechaPropuesta)} - {turno.horaPropuesta} hs
                        </p>
                        {turno.observacionAdmin ? <p className="mt-2 text-sm text-gray-600">{turno.observacionAdmin}</p> : null}
                      </div>
                    ) : null}

                    {estado === 'rechazado' && turno.motivoRechazo ? (
                      <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-red-700">Motivo de rechazo</p>
                        <p className="mt-1 text-sm text-red-800">{turno.motivoRechazo}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-lg bg-gray-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Acciones</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {necesitaDecision
                          ? 'Responde la solicitud del socio.'
                          : estaPropuesto
                            ? 'Esperando respuesta del socio.'
                            : 'Sin acciones pendientes.'}
                      </p>
                    </div>

                    {necesitaDecision ? (
                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => manejarAprobacion(turno)}
                          disabled={idActualizando === turno.id}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirPropuesta(turno)}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <Clock3 className="mr-1 h-4 w-4" />
                          Proponer horario
                        </button>
                        <button
                          type="button"
                          onClick={() => manejarRechazo(turno)}
                          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    ) : esEstadoAbierto(turno.estado) ? (
                      <button
                        type="button"
                        onClick={() => manejarRechazo(turno)}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rechazar
                      </button>
                    ) : null}

                  </div>
                </div>
              </article>
            )
          })}

          {!turnosFiltrados.length ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500">
              {turnos.length ? 'No hay turnos que coincidan con el filtro.' : 'No hay turnos registrados.'}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {turnosFiltrados.length} de {turnos.length} turnos. {ordenTurnos === 'recientes' ? 'Mas recientes primero.' : 'Mas viejos primero.'} Pagina {paginaActual} de {totalPaginas}
          </p>

          {turnosFiltrados.length > CANTIDAD_POR_PAGINA ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
                disabled={paginaActual === 1}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))}
                disabled={paginaActual === totalPaginas}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {modalAgendaAbierta ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <CalendarCheck className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Agenda de turnos confirmados</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Turnos aprobados directamente y propuestas aceptadas por los socios.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAgendaAbierta(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar agenda"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-emerald-700">Turnos confirmados</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {agendaConfirmada.reduce((total, dia) => total + dia.turnos.length, 0)}
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-blue-700">Dias con atencion</p>
                <p className="mt-1 text-2xl font-bold text-blue-800">{agendaConfirmada.length}</p>
              </div>
            </div>

            {agendaConfirmada.length ? (
              <div className="space-y-5">
                {agendaConfirmada.map((dia) => (
                  <section key={dia.fecha} className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <h3 className="font-bold capitalize text-gray-900">{formatearFechaLarga(dia.fecha)}</h3>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {dia.turnos.length} turno{dia.turnos.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {dia.turnos.map((turno) => (
                        <article
                          key={turno.id}
                          className="grid gap-3 px-4 py-4 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="flex items-center font-bold text-blue-700">
                            <Clock3 className="mr-2 h-4 w-4" />
                            {turno.horaAgenda || '--:--'} hs
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{turno.socio || `Socio ${turno.idSocio}`}</p>
                            <p className="mt-1 text-sm text-gray-600">{turno.motivo || 'Sin motivo informado'}</p>
                            {turno.documentoSocio ? (
                              <p className="mt-1 text-xs text-gray-500">Documento: {turno.documentoSocio}</p>
                            ) : null}
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${estilosEstadoTurno(turno.estado)}`}>
                            {turno.estado}
                          </span>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-gray-500">
                No hay turnos aprobados o aceptados para mostrar en la agenda.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {turnoEnPropuesta ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Proponer otro horario</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {turnoEnPropuesta.socio || `Socio ${turnoEnPropuesta.idSocio}`}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Solicito {formatearFechaLarga(turnoEnPropuesta.fecha)} - {turnoEnPropuesta.hora} hs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIdProponiendo(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar propuesta"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Dia para proponer</label>
                <select
                  value={formularioPropuesta.fechaPropuesta}
                  onChange={(evento) => {
                    const siguienteDia = disponibilidad.find((dia) => dia.fecha === evento.target.value)
                    setFormularioPropuesta((formularioAnterior) => ({
                      ...formularioAnterior,
                      fechaPropuesta: evento.target.value,
                      horaPropuesta: siguienteDia?.horarios[0] || ''
                    }))
                  }}
                  className="input-field"
                  disabled={idActualizando === turnoEnPropuesta.id || cargandoDisponibilidad}
                >
                  {cargandoDisponibilidad ? <option value="">Cargando horarios...</option> : null}
                  {!cargandoDisponibilidad && !disponibilidad.length ? <option value="">Sin horarios para proponer</option> : null}
                  {!cargandoDisponibilidad
                    ? disponibilidad.map((dia) => (
                        <option key={dia.fecha} value={dia.fecha} disabled={!dia.horarios.length}>
                          {formatearFechaCorta(dia.fecha)} - {dia.horarios.length} horarios
                        </option>
                      ))
                    : null}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-gray-700">Horario para proponer</p>
              {cargandoDisponibilidad ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  Cargando horarios para propuesta...
                </div>
              ) : diaPropuestaSeleccionado?.horarios?.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {diaPropuestaSeleccionado.horarios.map((horario) => (
                    <button
                      key={horario}
                      type="button"
                      onClick={() => setFormularioPropuesta((formularioAnterior) => ({ ...formularioAnterior, horaPropuesta: horario }))}
                      disabled={idActualizando === turnoEnPropuesta.id}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        formularioPropuesta.horaPropuesta === horario
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      {horario}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  No hay horarios disponibles para el dia seleccionado.
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIdProponiendo(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => manejarPropuesta(turnoEnPropuesta)}
                disabled={idActualizando === turnoEnPropuesta.id || cargandoDisponibilidad || !formularioPropuesta.fechaPropuesta || !formularioPropuesta.horaPropuesta}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="mr-2 h-4 w-4" />
                {idActualizando === turnoEnPropuesta.id ? 'Enviando...' : 'Enviar propuesta'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {turnoRechazando ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-600">Rechazar turno</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {turnoRechazando.socio || `Socio ${turnoRechazando.idSocio}`}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Solicito {formatearFechaLarga(turnoRechazando.fecha)} - {turnoRechazando.hora} hs
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarRechazo}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar rechazo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">Motivo del rechazo</label>
              <textarea
                value={motivoRechazo}
                onChange={(event) => setMotivoRechazo(event.target.value)}
                rows={5}
                minLength={MINIMO_CARACTERES_RECHAZO}
                maxLength={MAXIMO_CARACTERES_RECHAZO}
                className="input-field"
                placeholder="Ej: no hay disponibilidad para esa gestion, debe presentar documentacion previa..."
                disabled={idActualizando === turnoRechazando.id}
              />
              <p className="mt-2 text-xs text-gray-500">
                {limpiarTextoPlano(motivoRechazo).length}/{MAXIMO_CARACTERES_RECHAZO} caracteres. Minimo {MINIMO_CARACTERES_RECHAZO}.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cerrarRechazo}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                disabled={idActualizando === turnoRechazando.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={idActualizando === turnoRechazando.id}
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {idActualizando === turnoRechazando.id ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
