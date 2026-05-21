import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Droplet, ExternalLink, FilePlus2, Receipt, Settings, Zap } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import useAppStore from '@/store/appStore.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { formatDate } from '@/utils/formatDate.js'

export default function SocioDashboard() {
  const nombre = useAuthStore((state) => state.nombre)
  const usuario = useAuthStore((state) => state.usuario)
  const { socioId } = useCurrentSocio()
  const fetchServices = useCooperativeStore((state) => state.fetchServices)
  const fetchBillsBySocio = useCooperativeStore((state) => state.fetchBillsBySocio)
  const addNotification = useAppStore((state) => state.addNotification)

  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])

  useEffect(() => {
    fetchServices().then(setServices)
    fetchBillsBySocio({ idSocio: socioId, usuario }).then(setBills)
  }, [fetchBillsBySocio, fetchServices, socioId, usuario])

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

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {services.map((service) => (
          <div key={service.id} className="card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`mr-4 flex h-12 w-12 items-center justify-center rounded-full ${
                    service.name === 'Agua' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}
                >
                  {service.name === 'Agua' ? (
                    <Droplet className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Zap className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">Ultima lectura: {service.lastReading}</p>
                </div>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {service.status === 'active' ? 'Activo' : 'Inactivo'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Consumo</p>
                <p className="text-lg font-semibold text-gray-900">{service.consumption}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto</p>
                <p className="text-lg font-semibold text-gray-900">{service.amount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Facturas Pendientes</h2>
          <Link to="/facturas" className="font-medium text-blue-600 hover:text-blue-500">
            Ver todas
          </Link>
        </div>

        <div className="space-y-4">
          {pendingBills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div className="flex items-center">
                <div
                  className={`mr-4 flex h-10 w-10 items-center justify-center rounded-full ${
                    bill.service === 'Agua' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}
                >
                  {bill.service === 'Agua' ? (
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
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Acciones Rapidas</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/socio/mis-servicios" className="flex items-center rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100">
            <Settings className="mr-4 h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis Servicios</h3>
              <p className="text-sm text-gray-600">Gestionar servicios</p>
            </div>
          </Link>

          <Link to="/socio/mis-mediciones" className="flex items-center rounded-lg bg-green-50 p-4 transition-colors hover:bg-green-100">
            <Receipt className="mr-4 h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis Mediciones</h3>
              <p className="text-sm text-gray-600">Ver historial y consumos</p>
            </div>
          </Link>

          <Link to="/socio/reclamos" className="flex items-center rounded-lg bg-purple-50 p-4 transition-colors hover:bg-purple-100">
            <AlertTriangle className="mr-4 h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis Reclamos</h3>
              <p className="text-sm text-gray-600">Visualiza o realiza tus reclamos aqui.</p>
            </div>
          </Link>

          <Link to="/socio/solicitudes-servicio" className="flex items-center rounded-lg bg-amber-50 p-4 transition-colors hover:bg-amber-100">
            <FilePlus2 className="mr-4 h-8 w-8 text-amber-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Solicitudes de Servicio</h3>
              <p className="text-sm text-gray-600">Pedir altas y seguir el tramite.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
