import React, { useEffect, useState } from 'react'
import { Droplet, Gauge, Zap } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'

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

export default function SocioServicios() {
  const { socioId } = useCurrentSocio()
  const fetchSocioServices = useServiceWorkflowStore((state) => state.fetchSocioServices)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchMetersBySocio = useServiceWorkflowStore((state) => state.fetchMetersBySocio)
  const [services, setServices] = useState([])

  useEffect(() => {
    if (!socioId) return

    const loadServices = async () => {
      const servicesData = await fetchSocioServices(socioId)
      const metersData = fetchMetersBySocio ? await fetchMetersBySocio(socioId) : await fetchMeters()

      const enriched = (servicesData || []).map((service) => {
        const requiresMeter = serviceRequiresMeter(service.servicioNombre)
        const matchedMeter = requiresMeter
          ? (metersData || []).find((meter) => meterMatchesService(meter, service, socioId))
          : null

        return {
          ...service,
          numeroMedidor: matchedMeter?.NumeroMedidor || service.numeroMedidor || '',
          tipoMedidor: matchedMeter?.TipoMedidor || service.tipoMedidor || '',
          requiereMedidor: requiresMeter
        }
      })

      setServices(enriched)
    }

    loadServices()
  }, [fetchMeters, fetchMetersBySocio, fetchSocioServices, socioId])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Servicios</h1>
        <p className="mt-2 text-gray-600">Consulta tus servicios aprobados, tarifa y medidor asociado.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const Icon = serviceIcon(service.servicioNombre)
          return (
            <div key={service.idServicioSocio} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{service.servicioNombre}</h2>
                    <p className="text-sm text-gray-500">Tarifa base: ${service.tarifa.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {service.estado}
                </span>
              </div>

              {service.requiereMedidor ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">Medidor</p>
                    <p className="mt-1 font-semibold text-gray-900">{service.numeroMedidor || 'Pendiente instalacion'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">Tipo</p>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                      <Gauge className="h-4 w-4 text-gray-500" />
                      {service.tipoMedidor || 'Sin definir'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">Modalidad</p>
                  <p className="mt-1 font-semibold text-gray-900">Tarifa fija, sin medidor asociado</p>
                </div>
              )}
            </div>
          )
        })}

        {!services.length ? (
          <div className="card py-12 text-center md:col-span-2">
            <p className="text-lg font-medium text-gray-700">Todavia no tienes servicios aprobados.</p>
            <p className="mt-2 text-gray-500">Cuando una solicitud sea aprobada, aparecera aqui.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
