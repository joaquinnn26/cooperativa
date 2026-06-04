import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarCheck,
  CalendarPlus,
  Droplet,
  ExternalLink,
  FilePlus2,
  Gauge,
  Settings,
  UserCircle2,
  Zap
} from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import useAppStore from '@/store/appStore.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { formatDate } from '@/utils/formatDate.js'

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

function serviceIcon(nombre) {
  return normalizeServiceName(nombre).includes('agua') ? Droplet : Zap
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
    normalizeServiceName(meter.servicioNombre) === normalizeServiceName(service.servicioNombre)

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

  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])

  useEffect(() => {
    if (!socioId) return

    const loadData = async () => {
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
          const sameService = normalizeServiceName(measurement.servicioNombre) === normalizeServiceName(service.servicioNombre)

          return sameMeter || sameService
        })
        const latestMeasurement = serviceMeasurements[0] || null

        return {
          ...service,
          requiereMedidor: requiresMeter,
          numeroMedidor: matchedMeter?.NumeroMedidor || service.numeroMedidor || latestMeasurement?.NumeroMedidor || '',
          ultimaLectura: latestMeasurement?.LecturaActual ?? null,
          ultimoConsumo: latestMeasurement?.Consumo ?? null
        }
      })

      setServices(enrichedServices)
      setBills(billsData || [])
    }

    loadData()
  }, [fetchBillsBySocio, fetchMeasurementsBySocio, fetchMeters, fetchMetersBySocio, fetchSocioServices, socioId, usuario])

  const pendingBills = useMemo(() => bills.filter((bill) => bill.status !== 'paid'), [bills])

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Hola, {nombre || usuario || 'socio'}!</h1>
        <p className="text-lg text-gray-600">Bienvenido a tu panel de socio</p>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Mis servicios activos</h2>
          <Link to="/socio/mis-servicios" className="font-medium text-blue-600 hover:text-blue-500">
            Ver detalle
          </Link>
        </div>

        {services.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {services.map((service) => {
              const Icon = serviceIcon(service.servicioNombre)
              return (
                <div key={service.idServicioSocio} className="card">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{service.servicioNombre}</h3>
                        <p className="text-sm text-gray-600">Tarifa base: ${Number(service.tarifa || 0).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                    <div className="rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800">{service.estado}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{service.requiereMedidor ? 'Medidor' : 'Modalidad'}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {service.requiereMedidor ? service.numeroMedidor || 'Pendiente instalacion' : 'Tarifa fija'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{service.requiereMedidor ? 'Ultima lectura' : 'Ultimo consumo'}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {service.requiereMedidor
                          ? service.ultimaLectura ?? 'Sin lecturas'
                          : service.ultimoConsumo ?? 'No aplica'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card py-12 text-center">
            <p className="text-lg font-medium text-gray-700">Todavia no tienes servicios activos.</p>
            <p className="mt-2 text-gray-500">Cuando una solicitud sea aprobada, tus servicios apareceran aqui.</p>
          </div>
        )}
      </div>

      <div className="card mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Facturas pendientes</h2>
          <Link to="/facturas" className="font-medium text-blue-600 hover:text-blue-500">
            Ver todas
          </Link>
        </div>

        <div className="space-y-4">
          {pendingBills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div className="flex items-center">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  {normalizeServiceName(bill.service).includes('agua') ? (
                    <Droplet className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Zap className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {bill.service} - {bill.period}
                  </h3>
                  <p className="text-sm text-gray-600">Vence: {formatDate(bill.dueDate, 'es-AR')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${Number(bill.amount).toLocaleString('es-AR')}</p>
                </div>
                <button type="button" onClick={() => openPaymentLink(bill)} className="btn-primary text-sm">
                  <ExternalLink className="mr-1 inline h-4 w-4" />
                  Pagar
                </button>
              </div>
            </div>
          ))}
          {!pendingBills.length ? <p className="text-sm text-gray-500">No tienes facturas pendientes.</p> : null}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Acciones rapidas</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/socio/perfil" className="flex items-center rounded-lg bg-slate-50 p-4 transition-colors hover:bg-slate-100">
            <UserCircle2 className="mr-4 h-8 w-8 text-slate-700" />
            <div>
              <h3 className="font-semibold text-gray-900">Mi perfil</h3>
              <p className="text-sm text-gray-600">Telefono, direccion y contrasena</p>
            </div>
          </Link>

          <Link to="/socio/mis-servicios" className="flex items-center rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100">
            <Settings className="mr-4 h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis servicios</h3>
              <p className="text-sm text-gray-600">Estado, medidores y detalle</p>
            </div>
          </Link>

          <Link to="/socio/mis-mediciones" className="flex items-center rounded-lg bg-green-50 p-4 transition-colors hover:bg-green-100">
            <Gauge className="mr-4 h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis mediciones</h3>
              <p className="text-sm text-gray-600">Ver historial y consumos</p>
            </div>
          </Link>

          <Link to="/socio/reclamos" className="flex items-center rounded-lg bg-purple-50 p-4 transition-colors hover:bg-purple-100">
            <AlertTriangle className="mr-4 h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis reclamos</h3>
              <p className="text-sm text-gray-600">Consultas y reclamos</p>
            </div>
          </Link>

          <Link to="/socio/solicitudes-servicio" className="flex items-center rounded-lg bg-amber-50 p-4 transition-colors hover:bg-amber-100">
            <FilePlus2 className="mr-4 h-8 w-8 text-amber-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Solicitudes</h3>
              <p className="text-sm text-gray-600">Pedir altas y seguir el tramite</p>
            </div>
          </Link>

          <Link to="/socio/turnos/nuevo" className="flex items-center rounded-lg bg-cyan-50 p-4 transition-colors hover:bg-cyan-100">
            <CalendarPlus className="mr-4 h-8 w-8 text-cyan-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Nuevo turno</h3>
              <p className="text-sm text-gray-600">Solicitar atencion administrativa</p>
            </div>
          </Link>

          <Link to="/socio/turnos" className="flex items-center rounded-lg bg-indigo-50 p-4 transition-colors hover:bg-indigo-100">
            <CalendarCheck className="mr-4 h-8 w-8 text-indigo-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis turnos</h3>
              <p className="text-sm text-gray-600">Ver y aceptar propuestas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
