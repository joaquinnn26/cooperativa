import React, { useMemo, useState } from 'react'
import { CheckCircle2, Filter } from 'lucide-react'
import { formatDate } from '@/utils/formatDate.js'

const mockFacturas = [
  { id: 101, socio: 'Juan Pérez', servicio: 'Agua', periodo: 'Enero 2024', monto: 2500, vencimiento: '2024-02-15', estado: 'Pendiente' },
  { id: 102, socio: 'María Gómez', servicio: 'Luz', periodo: 'Enero 2024', monto: 1800, vencimiento: '2024-02-18', estado: 'Pagada' },
  { id: 103, socio: 'Carlos Ruiz', servicio: 'Agua', periodo: 'Enero 2024', monto: 2100, vencimiento: '2024-02-20', estado: 'Pendiente' }
]

export default function AdminFacturas() {
  const [facturas, setFacturas] = useState(mockFacturas)
  const [filtro, setFiltro] = useState('Todas')

  const filtered = useMemo(
    () => (filtro === 'Todas' ? facturas : facturas.filter((f) => f.estado === filtro)),
    [facturas, filtro]
  )

  const marcarPagada = (id) => {
    setFacturas((prev) => prev.map((f) => (f.id === id ? { ...f, estado: 'Pagada' } : f)))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600">Genera y controla facturas de servicios</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option>Todas</option>
            <option>Pendiente</option>
            <option>Pagada</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{f.id}</td>
                <td className="px-4 py-3">{f.socio}</td>
                <td className="px-4 py-3">{f.servicio}</td>
                <td className="px-4 py-3">{f.periodo}</td>
                <td className="px-4 py-3">{formatDate(f.vencimiento, 'es-AR', { month: 'short' })}</td>
                <td className="px-4 py-3">${f.monto}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      f.estado === 'Pagada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {f.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {f.estado === 'Pendiente' ? (
                    <button
                      onClick={() => marcarPagada(f.id)}
                      className="inline-flex items-center text-green-700 hover:text-green-900 font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Marcar pagada
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">Sin acción</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="text-center text-gray-500 py-6">No hay facturas.</p>}
      </div>
    </div>
  )
}
