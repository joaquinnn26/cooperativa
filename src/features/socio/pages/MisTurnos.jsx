import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  Send,
  SlidersHorizontal,
  XCircle,
  X
} from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { useTurnos } from '@/hooks/useTurnos.jsx'
import useAppStore from '@/store/appStore.js'
import useAuthStore from '@/store/authStore.js'
import { confirmAction } from '@/utils/alerts.js'
import {
  DIAS_DISPONIBILIDAD_TURNOS,
  MAXIMO_CARACTERES_MOTIVO_TURNO,
  MINIMO_CARACTERES_MOTIVO_TURNO,
  compararTurnosRecientes,
  estilosEstadoTurno,
  formatearFechaCorta,
  formatearFechaLarga,
  limpiarTextoPlano,
  normalizarTexto,
  normalizarTurno,
  validarSolicitudTurno
} from '@/utils/turnosUtils.jsx'
import { firstValidationError, isTodayOrFuture } from '@/utils/validation.js'
import './Turnos.css'
import './Turnos.css'

const CANTIDAD_POR_PAGINA = 5

const TIPOS_MOTIVO = [
  'Consulta administrativa',
  'Facturacion o pagos',
  'Reclamo presencial',
  'Entrega de documentacion',
  'Otro motivo'
]

const FILTROS_ESTADO = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'propuestos', label: 'Propuestos' },
  { key: 'confirmados', label: 'Confirmados' },
  { key: 'cerrados', label: 'Cerrados' }
]

function puedeAceptarPropuesta(turno) {
  return normalizarTexto(turno.estado).startsWith('propuest') && turno.fechaPropuesta && turno.horaPropuesta
}

function puedeCancelarTurno(turno) {
  const estado = normalizarTexto(turno.estado)
  return Boolean(turno.id) && !estado.startsWith('rechazad') && !estado.startsWith('cancelad')
}

function coincideConFiltroEstado(turno, filtro) {
  const estado = normalizarTexto(turno.estado)

  if (filtro === 'pendientes') return estado === 'pendiente'
  if (filtro === 'propuestos') return estado.startsWith('propuest')
  if (filtro === 'confirmados') return estado.startsWith('aprobad') || estado.startsWith('aceptad')
  if (filtro === 'cerrados') return estado.startsWith('rechazad') || estado.startsWith('cancelad')

  return true
}

export default function MisTurnos() {
  const { socioId, loadingSocio, resolveSocioId } = useCurrentSocio()
  const {
    aceptarPropuestaTurno,
    cancelarTurno,
    crearTurno,
    obtenerDisponibilidadTurnos,
    obtenerTurnosPorSocio
  } = useTurnos()
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const addNotification = useAppStore((state) => state.addNotification)
  const [searchParams, setSearchParams] = useSearchParams()
  const [turnos, setTurnos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [idActualizando, setIdActualizando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)
  const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('')
  const [tipoMotivo, setTipoMotivo] = useState(TIPOS_MOTIVO[0])
  const [motivoDetalle, setMotivoDetalle] = useState('')
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false)
  const [creandoTurno, setCreandoTurno] = useState(false)

  const cargarTurnos = async () => {
    setCargando(true)

    try {
      const idSocioResuelto = socioId ?? (await resolveSocioId())
      if (!idSocioResuelto) throw new Error('No se pudo identificar el socio actual.')

      const datos = await obtenerTurnosPorSocio(idSocioResuelto)
      setTurnos((datos || []).map(normalizarTurno).sort(compararTurnosRecientes))
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar tus turnos.',
        type: 'error'
      })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarTurnos()
  }, [socioId])

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setModalSolicitudAbierto(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!modalSolicitudAbierto) return

    let cancelado = false

    async function cargarDisponibilidad() {
      setCargandoDisponibilidad(true)

      try {
        const datosDisponibilidad = await obtenerDisponibilidadTurnos({
          dias: DIAS_DISPONIBILIDAD_TURNOS,
          turnosBase: turnos
        })
        if (cancelado) return

        setDisponibilidad(datosDisponibilidad)
        const primerDiaDisponible = datosDisponibilidad.find((dia) => dia.horarios.length)
        setFechaSeleccionada(primerDiaDisponible?.fecha || '')
        setHorarioSeleccionado(primerDiaDisponible?.horarios[0] || '')
      } catch (error) {
        if (cancelado) return
        console.error('Error al cargar disponibilidad de turnos', error)
        addNotification({
          title: 'Error',
          message: error.message || 'No se pudo cargar la disponibilidad de turnos.',
          type: 'error'
        })
      } finally {
        if (!cancelado) setCargandoDisponibilidad(false)
      }
    }

    cargarDisponibilidad()

    return () => {
      cancelado = true
    }
  }, [addNotification, obtenerDisponibilidadTurnos, modalSolicitudAbierto, turnos])

  const resumen = useMemo(
    () => ({
      total: turnos.length,
      pendientes: turnos.filter((turno) => ['pendiente', 'propuesto'].includes(normalizarTexto(turno.estado))).length,
      confirmados: turnos.filter((turno) => {
        const estado = normalizarTexto(turno.estado)
        return estado.startsWith('aprobad') || estado.startsWith('aceptad')
      }).length
    }),
    [turnos]
  )

  const turnosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase()

    return turnos.filter((turno) => {
      const textoBuscable = [
        turno.fecha,
        turno.hora,
        turno.fechaPropuesta,
        turno.horaPropuesta,
        turno.motivo,
        turno.estado,
        turno.motivoRechazo,
        turno.observacionAdmin
      ]
        .join(' ')
        .toLowerCase()

      return coincideConFiltroEstado(turno, filtroEstado) && (!textoBusqueda || textoBuscable.includes(textoBusqueda))
    })
  }, [busqueda, filtroEstado, turnos])

  const diaSeleccionado = useMemo(
    () => disponibilidad.find((dia) => dia.fecha === fechaSeleccionada),
    [disponibilidad, fechaSeleccionada]
  )
  const motivoDetalleLimpio = useMemo(() => limpiarTextoPlano(motivoDetalle), [motivoDetalle])
  const errorValidacion = useMemo(
    () =>
      validarSolicitudTurno({
        fecha: fechaSeleccionada,
        hora: horarioSeleccionado,
        motivoDetalle
      }),
    [motivoDetalle, fechaSeleccionada, horarioSeleccionado]
  )
  const motivoCompleto = `${tipoMotivo}: ${motivoDetalleLimpio}`
  const puedeEnviarSolicitud = !errorValidacion

  const totalPaginas = Math.max(1, Math.ceil(turnosFiltrados.length / CANTIDAD_POR_PAGINA))
  const turnosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * CANTIDAD_POR_PAGINA
    return turnosFiltrados.slice(inicio, inicio + CANTIDAD_POR_PAGINA)
  }, [paginaActual, turnosFiltrados])

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroEstado])

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas)
  }, [paginaActual, totalPaginas])

  const abrirModalSolicitud = () => {
    setModalSolicitudAbierto(true)
    setSearchParams({ nuevo: '1' })
  }

  const cerrarModalSolicitud = () => {
    setModalSolicitudAbierto(false)
    setTipoMotivo(TIPOS_MOTIVO[0])
    setMotivoDetalle('')
    setDisponibilidad([])
    setFechaSeleccionada('')
    setHorarioSeleccionado('')
    setSearchParams({})
  }

  const manejarSeleccionFecha = (dia) => {
    if (!dia.horarios.length) return
    setFechaSeleccionada(dia.fecha)
    setHorarioSeleccionado(dia.horarios[0])
  }

  const manejarCreacionTurno = async (evento) => {
    evento.preventDefault()

    const validationError = firstValidationError([
      errorValidacion,
      !isTodayOrFuture(fechaSeleccionada) ? 'La fecha del turno debe ser hoy o posterior.' : '',
      !TIPOS_MOTIVO.includes(tipoMotivo) ? 'Selecciona un motivo valido.' : ''
    ])

    if (validationError) {
      addNotification({
        title: 'Faltan datos',
        message: validationError,
        type: 'error'
      })
      return
    }

    setCreandoTurno(true)

    try {
      const idSocioResuelto = socioId ?? (await resolveSocioId())

      if (!idSocioResuelto) {
        throw new Error('No se pudo identificar el socio logueado.')
      }

      await crearTurno({
        idSocio: Number(idSocioResuelto),
        IdSocio: Number(idSocioResuelto),
        socioNombre: nombre || usuario || `Socio ${idSocioResuelto}`,
        SocioNombre: nombre || usuario || `Socio ${idSocioResuelto}`,
        socioDocumento: usuario || '',
        SocioDocumento: usuario || '',
        fecha: fechaSeleccionada,
        Fecha: fechaSeleccionada,
        hora: horarioSeleccionado,
        Hora: horarioSeleccionado,
        motivo: motivoCompleto,
        Motivo: motivoCompleto,
        estadoTurnoId: 1,
        idEstadoTurno: 1,
        IdEstadoTurno: 1
      })

      addNotification({
        title: 'Turno solicitado',
        message: 'Tu turno quedo pendiente de aprobacion.',
        type: 'success'
      })

      cerrarModalSolicitud()
      await cargarTurnos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo registrar el turno.',
        type: 'error'
      })
    } finally {
      setCreandoTurno(false)
    }
  }

  const manejarAceptarPropuesta = async (turno) => {
    const confirmado = await confirmAction({
      title: 'Aceptar horario propuesto',
      message: `Vas a confirmar el turno para ${formatearFechaLarga(turno.fechaPropuesta)} a las ${turno.horaPropuesta} hs.`,
      confirmButtonText: 'Aceptar horario',
      type: 'question'
    })

    if (!confirmado) return

    setIdActualizando(turno.id)

    try {
      await aceptarPropuestaTurno(turno.id)
      addNotification({
        title: 'Horario aceptado',
        message: 'El turno quedo confirmado con la propuesta del administrador.',
        type: 'success'
      })
      setBusqueda('')
      setFiltroEstado('confirmados')
      await cargarTurnos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo aceptar la propuesta.',
        type: 'error'
      })
    } finally {
      setIdActualizando(null)
    }
  }

  const manejarCancelarTurno = async (turno) => {
    const confirmado = await confirmAction({
      title: 'Cancelar turno',
      message: `Vas a cancelar el turno del ${formatearFechaLarga(turno.fecha)} a las ${turno.hora} hs. El registro va a seguir visible en tu historial.`,
      confirmButtonText: 'Cancelar turno',
      type: 'warning',
      danger: true
    })

    if (!confirmado) return

    setIdActualizando(turno.id)

    try {
      await cancelarTurno(turno.id)
      addNotification({
        title: 'Turno cancelado',
        message: 'El turno quedo cancelado correctamente.',
        type: 'success'
      })
      setTurnoSeleccionado(null)
      setBusqueda('')
      setFiltroEstado('cerrados')
      await cargarTurnos()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo cancelar el turno.',
        type: 'error'
      })
    } finally {
      setIdActualizando(null)
    }
  }

  if (cargando || loadingSocio) {
    return <div className="mt-10 text-center text-gray-500">Cargando turnos...</div>
  }

  return (
    <div className="turnos-page mx-auto max-w-6xl space-y-6 px-4 py-8">
      <BackToSocioDashboard />

      <div className="turnos-hero flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-cyan-100">Atención presencial</p>
          <h1>Mis turnos</h1>
          <p className="mt-2 max-w-xl text-sm leading-6">Pedí un horario, seguí la respuesta de Administración y confirmá cualquier propuesta desde un solo lugar.</p>
        </div>
        <button
          type="button"
          onClick={abrirModalSolicitud}
          className="turnos-hero-button relative z-10"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo turno
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="turnos-summary"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solicitudes realizadas</p><strong>{resumen.total}</strong><p className="text-xs text-slate-500">En tu historial</p>
        </div>
        <div className="turnos-summary"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Esperan respuesta</p><strong className="!text-amber-700">{resumen.pendientes}</strong><p className="text-xs text-slate-500">Pendientes o con propuesta</p>
        </div>
        <div className="turnos-summary"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmados</p><strong className="!text-emerald-700">{resumen.confirmados}</strong><p className="text-xs text-slate-500">Listos para asistir</p>
        </div>
      </div>

      <div className="turnos-panel space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full gap-3 lg:grid-cols-[minmax(240px,1fr)] xl:max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-100">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscá por fecha, motivo o estado..."
              aria-label="Buscar turnos"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center text-sm font-medium text-gray-500">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Estado
            </span>
            {FILTROS_ESTADO.map((filtro) => (
              <button
                key={filtro.key}
                type="button"
                onClick={() => setFiltroEstado(filtro.key)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  filtroEstado === filtro.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Se muestran {turnosFiltrados.length} de {turnos.length} turnos, del más reciente al más antiguo.
        </p>
      </div>

      <div className="space-y-4">
        {turnosPaginados.map((turno) => (
          <div key={turno.id} className="turnos-panel turnos-list-card">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-800">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold capitalize tracking-tight text-slate-900">
                      {formatearFechaLarga(turno.fecha)} - {turno.hora} hs
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">{turno.motivo}</p>
                  </div>
                </div>

                {turno.fechaPropuesta && turno.horaPropuesta ? (
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Administración te propone</p>
                    <p className="mt-1 font-semibold capitalize text-gray-900">
                      {formatearFechaLarga(turno.fechaPropuesta)} - {turno.horaPropuesta} hs
                    </p>
                    {turno.observacionAdmin ? (
                      <p className="mt-2 text-sm text-gray-600">{turno.observacionAdmin}</p>
                    ) : null}
                  </div>
                ) : null}

                {normalizarTexto(turno.estado).startsWith('rechazad') && turno.motivoRechazo ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-xs uppercase text-red-700">Motivo de rechazo</p>
                    <p className="mt-1 text-sm text-red-800">{turno.motivoRechazo}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 lg:min-w-52 lg:items-end">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estilosEstadoTurno(turno.estado)}`}>
                  {turno.estado}
                </span>

                <button
                  type="button"
                  onClick={() => setTurnoSeleccionado(turno)}
                  className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </button>

                {puedeAceptarPropuesta(turno) ? (
                  <button
                    type="button"
                    onClick={() => manejarAceptarPropuesta(turno)}
                    disabled={idActualizando === turno.id}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {idActualizando === turno.id ? 'Aceptando...' : 'Aceptar horario'}
                  </button>
                ) : null}

                {puedeCancelarTurno(turno) ? (
                  <button
                    type="button"
                    onClick={() => manejarCancelarTurno(turno)}
                    disabled={idActualizando === turno.id}
                    className="inline-flex items-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {idActualizando === turno.id ? 'Cancelando...' : 'Cancelar turno'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {!turnosFiltrados.length ? (
          <div className="turnos-panel py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">
              {turnos.length ? 'No hay turnos con esos filtros.' : 'No tenes turnos registrados.'}
            </p>
            <p className="mt-2 text-gray-500">
              {turnos.length ? 'Proba cambiando el estado o la busqueda.' : 'Cuando solicites uno, vas a verlo aca con su estado.'}
            </p>
            <button
              type="button"
              onClick={abrirModalSolicitud}
              className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Solicitar turno
            </button>
          </div>
        ) : null}

        {turnosFiltrados.length > CANTIDAD_POR_PAGINA ? (
          <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Pagina {paginaActual} de {totalPaginas}
            </p>
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
          </div>
        ) : null}
      </div>

      {modalSolicitudAbierto ? (
        <div className="turnos-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !creandoTurno) cerrarModalSolicitud() }}>
          <div role="dialog" aria-modal="true" aria-labelledby="turnos-solicitud-title" className="turnos-modal max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-[1.5rem] border border-white/70 bg-[#f8fbfc] p-4 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-800">Nueva solicitud</p>
                  <h2 id="turnos-solicitud-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Elegí cuándo venir</h2>
                  <p className="mt-1 text-sm text-slate-600">Elegí un día y horario libre, contanos el motivo y enviá la solicitud a Administración.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModalSolicitud}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar solicitud de turno"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={manejarCreacionTurno} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <section className="turnos-step-card">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-sm font-extrabold text-cyan-900">1</div>
                    <div><h3 className="text-base font-bold text-gray-900">Elegí un día</h3><p className="text-xs text-slate-500">Solo mostramos fechas con disponibilidad real</p></div>
                  </div>

                  {cargandoDisponibilidad ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando disponibilidad...
                    </div>
                  ) : disponibilidad.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {disponibilidad.map((dia) => {
                        const activo = fechaSeleccionada === dia.fecha

                        return (
                          <button
                            key={dia.fecha}
                            type="button"
                            onClick={() => manejarSeleccionFecha(dia)}
                            disabled={!dia.horarios.length || creandoTurno}
                            aria-pressed={activo}
                            className={`turnos-choice rounded-xl border px-4 py-3 text-left ${
                              activo
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : dia.horarios.length
                                  ? 'border-gray-200 bg-white text-gray-800 hover:border-blue-200 hover:bg-gray-50'
                                  : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                          >
                            <span className="block text-sm font-semibold capitalize">{formatearFechaCorta(dia.fecha)}</span>
                            <span className="mt-1 block text-xs">
                              {dia.horarios.length ? `${dia.horarios.length} horarios libres` : 'Completo'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-500">
                      No hay turnos disponibles desde la fecha actual.
                    </div>
                  )}
                </section>

                <section className="turnos-step-card">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-sm font-extrabold text-cyan-900">2</div>
                    <div><h3 className="text-base font-bold text-gray-900">Elegí un horario</h3><p className="text-xs text-slate-500">{fechaSeleccionada ? formatearFechaCorta(fechaSeleccionada) : 'Primero seleccioná un día'}</p></div>
                  </div>

                  {diaSeleccionado?.horarios?.length ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                      {diaSeleccionado.horarios.map((horario) => (
                        <button
                          key={horario}
                          type="button"
                          onClick={() => setHorarioSeleccionado(horario)}
                          disabled={creandoTurno}
                          aria-pressed={horarioSeleccionado === horario}
                          className={`turnos-choice rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                            horarioSeleccionado === horario
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
                      Selecciona un dia con horarios disponibles.
                    </div>
                  )}
                </section>

                <section className="turnos-step-card grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <div className="mb-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-sm font-extrabold text-cyan-900">3</span><div><h3 className="text-base font-bold text-gray-900">Contanos el motivo</h3><p className="text-xs text-slate-500">Así podemos preparar la atención</p></div></div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de consulta</label>
                    <select
                      value={tipoMotivo}
                      onChange={(evento) => setTipoMotivo(evento.target.value)}
                      className="turnos-field w-full px-3 py-3 text-sm"
                      disabled={creandoTurno}
                    >
                      {TIPOS_MOTIVO.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Detalle</label>
                    <textarea
                      value={motivoDetalle}
                      onChange={(evento) => setMotivoDetalle(evento.target.value)}
                      placeholder="Ej: consulta por factura, alta de tramite, documentacion pendiente..."
                      rows={4}
                      minLength={MINIMO_CARACTERES_MOTIVO_TURNO}
                      maxLength={MAXIMO_CARACTERES_MOTIVO_TURNO}
                      required
                      className="turnos-field w-full px-3 py-3 text-sm"
                      disabled={creandoTurno}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {motivoDetalleLimpio.length}/{MAXIMO_CARACTERES_MOTIVO_TURNO} caracteres. Minimo {MINIMO_CARACTERES_MOTIVO_TURNO}.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="h-fit space-y-4 rounded-2xl border border-cyan-100 bg-gradient-to-br from-[#eaf6f7] to-white p-5 shadow-sm lg:sticky lg:top-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-800">Resumen de tu turno</p>
                  <h3 className="mt-3 text-lg font-bold capitalize text-gray-900">
                    {fechaSeleccionada ? formatearFechaLarga(fechaSeleccionada) : 'Sin dia seleccionado'}
                  </h3>
                  <p className="mt-1 text-2xl font-extrabold text-cyan-800">
                    {horarioSeleccionado ? `${horarioSeleccionado} hs` : 'Sin horario'}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Después de enviar</p>
                  <p className="mt-1 font-semibold text-gray-900">Administración revisará tu solicitud</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Motivo</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {motivoDetalleLimpio ? motivoCompleto : 'Todavia no completaste el detalle.'}
                  </p>
                </div>

                {loadingSocio ? <p className="text-sm text-gray-500">Identificando socio actual...</p> : null}

                <div className="turnos-modal-footer -mx-2 flex flex-col gap-2 px-2 pt-3 sm:flex-row sm:justify-end lg:flex-col">
                  <button
                    type="button"
                    onClick={cerrarModalSolicitud}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    disabled={creandoTurno}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creandoTurno || loadingSocio || cargandoDisponibilidad || !puedeEnviarSolicitud}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-800 to-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {creandoTurno ? 'Enviando...' : 'Solicitar turno'}
                  </button>
                </div>
              </aside>
            </form>
          </div>
        </div>
      ) : null}

      {turnoSeleccionado ? (
        <div className="turnos-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setTurnoSeleccionado(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="turno-detalle-title" className="turnos-modal w-full max-w-2xl rounded-[1.4rem] border border-white/70 bg-[#f9fcfd] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-800">Detalle del turno</p>
                <h2 id="turno-detalle-title" className="mt-1 text-2xl font-bold text-gray-900">{turnoSeleccionado.motivo || 'Turno presencial'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setTurnoSeleccionado(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Solicitado</p>
                <p className="mt-1 font-semibold capitalize text-gray-900">
                  {formatearFechaLarga(turnoSeleccionado.fecha)} - {turnoSeleccionado.hora} hs
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Estado</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estilosEstadoTurno(turnoSeleccionado.estado)}`}>
                  {turnoSeleccionado.estado}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase text-gray-500">Motivo</p>
                <p className="mt-1 text-sm text-gray-700">{turnoSeleccionado.motivo || 'Sin motivo informado'}</p>
              </div>
              {turnoSeleccionado.fechaPropuesta && turnoSeleccionado.horaPropuesta ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase text-blue-700">Propuesta del administrador</p>
                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {formatearFechaLarga(turnoSeleccionado.fechaPropuesta)} - {turnoSeleccionado.horaPropuesta} hs
                  </p>
                  {turnoSeleccionado.observacionAdmin ? (
                    <p className="mt-2 text-sm text-gray-600">{turnoSeleccionado.observacionAdmin}</p>
                  ) : null}
                </div>
              ) : null}
              {normalizarTexto(turnoSeleccionado.estado).startsWith('rechazad') && turnoSeleccionado.motivoRechazo ? (
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase text-red-700">Motivo de rechazo</p>
                  <p className="mt-1 text-sm text-red-800">{turnoSeleccionado.motivoRechazo}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {puedeCancelarTurno(turnoSeleccionado) ? (
                <button
                  type="button"
                  onClick={() => manejarCancelarTurno(turnoSeleccionado)}
                  disabled={idActualizando === turnoSeleccionado.id}
                  className="inline-flex items-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {idActualizando === turnoSeleccionado.id ? 'Cancelando...' : 'Cancelar turno'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setTurnoSeleccionado(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
