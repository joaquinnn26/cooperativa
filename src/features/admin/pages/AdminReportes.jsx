import React from 'react'
import { BarChart2, Download, PieChart, Activity } from 'lucide-react'

const cards = [
  { label: 'Recaudación mes', value: '$4.7M', detail: '+12% vs pasado', icon: BarChart2, color: 'bg-blue-100 text-blue-700' },
  { label: 'Pagos pendientes', value: '86', detail: 'Facturas por cobrar', icon: PieChart, color: 'bg-yellow-100 text-yellow-700' },
  { label: 'Reclamos activos', value: '24', detail: '12 en proceso', icon: Activity, color: 'bg-red-100 text-red-700' }
]

export default function AdminReportes() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Indicadores rápidos de la cooperativa</p>
        </div>
        <button className="btn-secondary inline-flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm text-gray-500 mt-1">{c.detail}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${c.color}`}>
              <c.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Resumen mensual</h2>
        <p className="text-gray-600">
          Aquí puedes integrar gráficas reales (ej. Recharts/Chart.js). Por ahora se muestra un placeholder.
        </p>
        <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
          Área de gráfica
        </div>
      </div>
    </div>
  )
}
