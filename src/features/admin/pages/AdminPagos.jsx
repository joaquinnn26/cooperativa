import React from 'react'
import { CreditCard, Download, Receipt, CheckCircle } from 'lucide-react'

const pagos = [
  { id: 1, socio: 'Juan Pérez', metodo: 'Tarjeta', referencia: 'TRX-001', monto: 2500, fecha: '2024-02-01', estado: 'Confirmado' },
  { id: 2, socio: 'María Gómez', metodo: 'Transferencia', referencia: 'TRX-002', monto: 1800, fecha: '2024-02-02', estado: 'Pendiente' }
]

export default function AdminPagos() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600">Revisa y concilia pagos recibidos</p>
        </div>
        <button className="btn-secondary inline-flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <tr key={pago.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{pago.id}</td>
                <td className="px-4 py-3">{pago.socio}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  {pago.metodo}
                </td>
                <td className="px-4 py-3">{pago.referencia}</td>
                <td className="px-4 py-3">${pago.monto}</td>
                <td className="px-4 py-3">{pago.fecha}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      pago.estado === 'Confirmado'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {pago.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="inline-flex items-center text-blue-600 hover:text-blue-800">
                    <Receipt className="w-4 h-4 mr-1" />
                    Ver comprobante
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
