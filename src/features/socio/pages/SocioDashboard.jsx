import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplet, Zap, Settings, Receipt, AlertTriangle } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import useAppStore from '@/store/appStore.js'
import { formatDate } from '@/utils/formatDate.js'

export default function SocioDashboard() {
  const user = useAuthStore((state) => state.user)
  const fetchServices = useCooperativeStore((state) => state.fetchServices)
  const fetchBills = useCooperativeStore((state) => state.fetchBills)
  const payBill = useCooperativeStore((state) => state.payBill)
  const addNotification = useAppStore((state) => state.addNotification)

  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])

  useEffect(() => {
    fetchServices().then(setServices)
    fetchBills().then(setBills)
  }, [fetchServices, fetchBills])

  const pendingBills = useMemo(() => bills.filter((bill) => bill.status === 'pending'), [bills])

  const handlePayBill = async (billId) => {
    try {
      await payBill(billId)
      addNotification({ title: '¡Éxito!', message: 'Factura pagada correctamente', type: 'success' })
      fetchBills().then(setBills)
    } catch (error) {
      addNotification({ title: 'Error', message: 'No se pudo procesar el pago', type: 'error' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.name || 'socio'}!
        </h1>
        <p className="text-lg text-gray-600">Bienvenido a tu panel de socio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {services.map((service) => (
          <div key={service.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                    service.name === 'Agua' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}
                >
                  {service.name === 'Agua' ? (
                    <Droplet className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Zap className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">Última lectura: {service.lastReading}</p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  service.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Facturas Pendientes</h2>
          <Link to="/facturas" className="text-blue-600 hover:text-blue-500 font-medium">
            Ver todas
          </Link>
        </div>

        <div className="space-y-4">
          {pendingBills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    bill.service === 'Agua' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}
                >
                  {bill.service === 'Agua' ? (
                    <Droplet className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Zap className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {bill.service} - {bill.period}
                  </h3>
                  <p className="text-sm text-gray-600">Vence: {formatDate(bill.dueDate, 'es-ES')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{bill.amount}</p>
                  <p className="text-sm text-gray-600">{bill.consumption}</p>
                </div>
                <button type="button" onClick={() => handlePayBill(bill.id)} className="btn-primary text-sm">
                  Pagar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/servicios"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Settings className="w-8 h-8 text-blue-600 mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis Servicios</h3>
              <p className="text-sm text-gray-600">Gestionar servicios</p>
            </div>
          </Link>

          <Link
            to="/facturas"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Receipt className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">Facturas</h3>
              <p className="text-sm text-gray-600">Ver historial</p>
            </div>
          </Link>

          <Link
            to="/socio/reclamos"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <AlertTriangle className="w-8 h-8 text-purple-600 mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">Mis Reclamos</h3>
              <p className="text-sm text-gray-600">Visualiza o realiza tus reclamos aquí.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
