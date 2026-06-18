import React, { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import useCooperativeStore from '@/store/cooperativeStore.js'

export default function AdminPagos() {
  const fetchBills = useCooperativeStore((state) => state.fetchBills)
  const [paidBills, setPaidBills] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const bills = await fetchBills()
        setPaidBills((bills || []).filter((bill) => bill.status === 'paid'))
      } catch (loadError) {
        setError(loadError.message || 'No se pudieron cargar las facturas pagadas.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [fetchBills])

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagos informados</h1>
        <p className="text-gray-600">
          Esta vista refleja facturas marcadas como pagadas. No registra transacciones bancarias reales.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Fecha informada</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {paidBills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-blue-600" />#{bill.id}
                    </span>
                  </td>
                  <td className="px-4 py-3">{bill.socioNombre}</td>
                  <td className="px-4 py-3">{bill.service}</td>
                  <td className="px-4 py-3">
                    {Number(bill.amount || 0).toLocaleString('es-AR', {
                      style: 'currency',
                      currency: 'ARS'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {bill.paidAt ? new Date(bill.paidAt).toLocaleString('es-AR') : 'Sin fecha'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Pagada
                    </span>
                  </td>
                </tr>
              ))}
              {!paidBills.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay facturas pagadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
