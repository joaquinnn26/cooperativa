import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Droplet,
  ExternalLink,
  FilePlus2,
  Gauge,
  Receipt,
  Settings,
  Wifi,
  Zap
} from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import useAppStore from '@/store/appStore.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { useAvisos } from '@/features/avisos/AvisosProvider.jsx'
import { AvisosCard } from '@/features/avisos/AvisosWidgets.jsx'
import { formatDate } from '@/utils/formatDate.js'
import { isInternetService, normalizeServiceText, serviceRequiresInstallation, serviceRequiresMeter } from '@/utils/serviceInstallation.js'

function serviceIcon(nombre) {
  if (isInternetService(nombre)) return Wifi
  return normalizeServiceText(nombre).includes('agua') ? Droplet : Zap
}

function meterMatchesService(meter, service, socioId) {
  const sameAssignment =
    meter.idServicioSocio != null &&
    service.idServicioSocio != null &&
    String(meter.idServicioSocio) === String(service.idServicioSocio)

  if (sameAssignment) return true

  const sameSocio =
    String(meter.idSocio || '') === String(service.idSocio || socioId || '') ||
    (meter.socioUsuario && service.socioUsuario && String(meter.socioUsuario) === String(service.socioUsuario))

  const sameService =
    (meter.idServicio && service.idServicio && Number(meter.idServicio) === Number(service.idServicio)) ||
    normalizeServiceText(meter.servicioNombre) === normalizeServiceText(service.servicioNombre)

  return sameSocio && sameService
}

export default function SocioDashboard() {
  const nombre = useAuthStore((state) => state.nombre)
  const usuario = useAuthStore((state) => state.usuario)
  const { socioId } = useCurrentSocio()
  const fetchBillsBySocio = useCooperativeStore((state) => state.fetchBillsBySocio)
  const fetchSocioServices = useServiceWorkflowStore((state) => state.fetchSocioServices)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchMetersBySocio = useServiceWorkflowStore((state) => state.fetchMetersBySocio)
  const fetchMeasurementsBySocio = useServiceWorkflowStore((state) => state.fetchMeasurementsBySocio)
  const addNotification = useAppStore((state) => state.addNotification)
  const { noLeidos } = useAvisos()

  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])

  useEffect(() => {
    if (!socioId) return

    const loadData = async () => {
      try {
        const [servicesData, measurementsData, billsData] = await Promise.all([
          fetchSocioServices(socioId),
          fetchMeasurementsBySocio(socioId),
          fetchBillsBySocio({ idSocio: socioId, usuario })
        ])
        const metersData = fetchMetersBySocio ? await fetchMetersBySocio(socioId) : await fetchMeters()

        const enrichedServices = (servicesData || []).map((service) => {
          const requiresMeter = serviceRequiresMeter(service.servicioNombre)
          const matchedMeter = requiresMeter
            ? (metersData || []).find((meter) => meterMatchesService(meter, service, socioId))
            : null

          const serviceMeasurements = (measurementsData || []).filter((measurement) => {
            const sameMeter =
              matchedMeter?.NumeroMedidor &&
              measurement.NumeroMedidor &&
              String(measurement.NumeroMedidor) === String(matchedMeter.NumeroMedidor)
            const sameService =
              normalizeServiceText(measurement.servicioNombre) ===
              normalizeServiceText(service.servicioNombre)

            return sameMeter || sameService
          })
          const latestMeasurement = serviceMeasurements[0] || null

          return {
            ...service,
            requiereMedidor: requiresMeter,
            requiereInstalacion: serviceRequiresInstallation(service.servicioNombre),
            instalacionPendiente: serviceRequiresInstallation(service.servicioNombre) && !matchedMeter?.NumeroMedidor,
            numeroMedidor:
              matchedMeter?.NumeroMedidor ||
              service.numeroMedidor ||
              latestMeasurement?.NumeroMedidor ||
              '',
            ultimaLectura: latestMeasurement?.LecturaActual ?? null,
            ultimoConsumo: latestMeasurement?.Consumo ?? null
          }
        })

        setServices(enrichedServices)
        setBills(billsData || [])
      } catch (error) {
        addNotification({
          title: 'No se pudo cargar el panel',
          message: error.message || 'La API no esta disponible.',
          type: 'error'
        })
      }
    }

    loadData()
  }, [
    addNotification,
    fetchBillsBySocio,
    fetchMeasurementsBySocio,
    fetchMeters,
    fetchMetersBySocio,
    fetchSocioServices,
    socioId,
    usuario
  ])

  const pendingBills = useMemo(() => bills.filter((bill) => bill.status === 'pending'), [bills])
  const totalPendingAmount = useMemo(
    () => pendingBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
    [pendingBills]
  )
  const nextDueBill = useMemo(
    () =>
      [...pendingBills].sort((a, b) => {
        const firstDate = new Date(a.dueDate).getTime()
        const secondDate = new Date(b.dueDate).getTime()
        return firstDate - secondDate
      })[0] || null,
    [pendingBills]
  )
  const todayLabel = useMemo(() => formatDate(new Date(), 'es-AR', { weekday: 'long' }), [])
  const quickActions = useMemo(
    () => [
      {
        to: '/facturas',
        title: 'Facturas',
        description: pendingBills.length ? `${pendingBills.length} pendiente${pendingBills.length === 1 ? '' : 's'}` : 'Consultar estados confirmados',
        icon: Receipt,
        classes: 'border-amber-100 bg-amber-50 text-amber-700'
      },
      {
        to: '/socio/turnos',
        title: 'Turnos',
        description: 'Solicitudes y propuestas',
        icon: CalendarCheck,
        classes: 'border-indigo-100 bg-indigo-50 text-indigo-700'
      },
      {
        to: '/socio/solicitudes-servicio',
        title: 'Solicitudes',
        description: 'Altas y seguimiento',
        icon: FilePlus2,
        classes: 'border-amber-100 bg-amber-50 text-amber-700'
      },
      {
        to: '/socio/reclamos',
        title: 'Reclamos',
        description: 'Atencion y seguimiento',
        icon: AlertTriangle,
        classes: 'border-rose-100 bg-rose-50 text-rose-700'
      },
      {
        to: '/socio/mis-mediciones',
        title: 'Mediciones',
        description: 'Historial y consumos',
        icon: Gauge,
        classes: 'border-green-100 bg-green-50 text-green-700'
      },
      {
        to: '/socio/mis-servicios',
        title: 'Servicios',
        description: 'Estado y medidores',
        icon: Settings,
        classes: 'border-slate-200 bg-slate-50 text-slate-700'
      }
    ],
    [pendingBills.length]
  )

  const openPaymentLink = (bill) => {
    if (!bill.paymentLink) {
      addNotification({
        title: 'Pago no disponible',
        message: 'La factura no tiene link de pago cargado.',
        type: 'error'
      })
      return
    }

    window.open(bill.paymentLink, '_blank', 'noopener,noreferrer')
  }

  const unverifiedBills = bills.filter(b => b.status === 'unverified')
  const BillingStatusIcon = pendingBills.length || unverifiedBills.length ? AlertTriangle : CheckCircle2
  const billingStatus = unverifiedBills.length ? { label: 'Confirmación pendiente', title: 'Hay facturas sin estado confirmado', description: 'Consultá Mis facturas. La actualización de pagos depende de la integración con contabilidad.', amount: 'Sin confirmar', panel: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-700' } : pendingBills.length
    ? {
        label: 'Requiere atencion',
        title: `${pendingBills.length} factura${pendingBills.length === 1 ? '' : 's'} pendiente${pendingBills.length === 1 ? '' : 's'}`,
        description: nextDueBill
          ? `Vencimiento mas cercano: ${formatDate(nextDueBill.dueDate, 'es-AR')}`
          : 'Hay facturas pendientes para revisar.',
        amount: `$${totalPendingAmount.toLocaleString('es-AR')}`,
        panel: 'border-amber-200 bg-amber-50',
        icon: 'bg-amber-100 text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        titleColor: 'text-amber-950'
      }
    : {
        label: 'Sin deuda',
        title: 'Sin pendientes confirmados',
        description: 'No hay facturas con estado pendiente confirmado en esta consulta.',
        amount: '$0',
        panel: 'border-emerald-200 bg-emerald-50',
        icon: 'bg-emerald-100 text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
        titleColor: 'text-emerald-950'
      }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-gray-500">Portal del socio</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Hola, {nombre || usuario || 'socio'}!</h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm">
          <Clock3 className="h-4 w-4 text-gray-400" />
          <span className="capitalize">{todayLabel}</span>
        </div>
      </div>

      <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`rounded-lg border p-6 shadow-sm ${billingStatus.panel}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${billingStatus.icon}`}>
                <BillingStatusIcon className="h-7 w-7" />
              </div>

              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${billingStatus.badge}`}>
                  {billingStatus.label}
                </span>
                <h2 className={`mt-3 text-3xl font-bold ${billingStatus.titleColor}`}>{billingStatus.title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-700">{billingStatus.description}</p>
              </div>
            </div>

            <div className="border-t border-white/70 pt-4 lg:min-w-[220px] lg:border-l lg:border-t-0 lg:pl-6">
              <p className="text-sm font-semibold uppercase text-gray-500">Total pendiente</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{billingStatus.amount}</p>
              <Link
                to="/facturas"
                className="mt-4 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Ver facturas
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-medium text-gray-700">
              <Receipt className="h-4 w-4 text-amber-600" />
              Facturas: <strong className="text-gray-900">{pendingBills.length}</strong>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-medium text-gray-700">
              <Settings className="h-4 w-4 text-cyan-700" />
              Servicios: <strong className="text-gray-900">{services.length}</strong>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-medium text-gray-700">
              <Bell className="h-4 w-4 text-indigo-700" />
              Avisos: <strong className="text-gray-900">{noLeidos ?? '—'}</strong>
            </span>
          </div>
        </div>

        <AvisosCard />
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Acciones rapidas</h2>
        </div>

        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex min-h-[112px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${action.classes}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-blue-500" />
                </span>
                <span className="mt-4 block min-w-0">
                  <span className="block font-semibold leading-snug text-gray-900">{action.title}</span>
                  <span className="mt-1 block text-sm leading-snug text-gray-600">{action.description}</span>
                </span>
              </Link>
            )
          })}
        </nav>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Facturas pendientes</h2>
              <p className="text-sm text-gray-500">Prioriza vencimientos y pagos disponibles.</p>
            </div>
            <Link to="/facturas" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              Ver todas
            </Link>
          </div>

          {pendingBills.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Servicio</th>
                    <th className="px-5 py-3 font-semibold">Periodo</th>
                    <th className="px-5 py-3 font-semibold">Vencimiento</th>
                    <th className="px-5 py-3 text-right font-semibold">Importe</th>
                    <th className="px-5 py-3 text-right font-semibold">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingBills.slice(0, 5).map((bill) => (
                    <tr key={bill.id} className="bg-white">
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                            {normalizeServiceText(bill.service).includes('agua') ? (
                              <Droplet className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Zap className="h-5 w-5 text-yellow-600" />
                            )}
                          </span>
                          <span className="font-semibold text-gray-900">{bill.service}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{bill.period}</td>
                      <td className="px-5 py-4 text-gray-600">{formatDate(bill.dueDate, 'es-AR')}</td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        ${Number(bill.amount || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openPaymentLink(bill)}
                          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Pagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-3 font-medium text-gray-700">No tienes facturas pendientes.</p>
              <p className="mt-1 text-sm text-gray-500">Cuando haya una boleta impaga, aparecera en este espacio.</p>
            </div>
          )}
        </section>

        <aside className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Servicios activos</h2>
              <p className="text-sm text-gray-500">Vista resumida de tus conexiones.</p>
            </div>
            <Link to="/socio/mis-servicios" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              Ver detalle
            </Link>
          </div>

          {services.length ? (
            <div className="divide-y divide-gray-100 px-5">
              {services.slice(0, 4).map((service) => {
                const Icon = serviceIcon(service.servicioNombre)
                return (
                  <div key={service.idServicioSocio} className="flex items-center justify-between gap-3 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">{service.servicioNombre}</h3>
                        <p className="truncate text-sm text-gray-600">
                          {service.requiereMedidor
                            ? `Medidor: ${service.numeroMedidor || 'pendiente'}`
                            : service.requiereInstalacion
                              ? 'Pendiente instalacion'
                              : 'Tarifa fija'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        {service.estado}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        {service.requiereMedidor
                          ? service.ultimaLectura ?? 'Sin lectura'
                          : service.requiereInstalacion
                            ? 'Sin consumo'
                            : 'Mensual fijo'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="font-medium text-gray-700">Todavia no tienes servicios activos.</p>
              <p className="mt-1 text-sm text-gray-500">Cuando una solicitud sea aprobada, aparecera aqui.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
