import React, { useEffect, useState } from 'react'
import { Droplet, Gauge, Zap } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'

function serviceIcon(nombre) {
  return nombre === 'Agua' ? Droplet : Zap
}

export default function SocioServicios() {
  const usuario = useAuthStore((state) => state.usuario)
  const fetchSocioServices = useServiceWorkflowStore((state) => state.fetchSocioServices)
  const [services, setServices] = useState([])

  useEffect(() => {
    fetchSocioServices(usuario).then(setServices)
  }, [fetchSocioServices, usuario])

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
