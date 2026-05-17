import React from 'react'
import { Link } from 'react-router-dom'
import { ClipboardPenLine, Gauge } from 'lucide-react'

export default function EmpleadoDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Empleado</h1>
        <p className="mt-2 text-gray-600">Carga lecturas y consulta medidores instalados.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/empleado/mediciones" className="card flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="rounded-full bg-blue-100 p-3 text-blue-700">
            <ClipboardPenLine className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cargar Mediciones</h2>
            <p className="text-sm text-gray-600">Busca medidores, registra lecturas y consulta historial.</p>
          </div>
        </Link>

        <div className="card flex items-center gap-4">
          <div className="rounded-full bg-amber-100 p-3 text-amber-700">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Trabajo en campo</h2>
            <p className="text-sm text-gray-600">Las lecturas quedaran asociadas al medidor y al socio.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
