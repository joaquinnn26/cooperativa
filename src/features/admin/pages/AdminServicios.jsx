import React, { useMemo, useState } from 'react'
import { PlusCircle, Wrench, Zap, Droplet, ToggleRight } from 'lucide-react'

const mockServicios = [
  { idServicio: 1, nombre: 'Agua', tipo: 'Medido', tarifa: '$2,500', estado: true, icon: Droplet },
  { idServicio: 2, nombre: 'Luz', tipo: 'Medido', tarifa: '$1,800', estado: true, icon: Zap },
  { idServicio: 3, nombre: 'Cloacas', tipo: 'Fijo', tarifa: '$900', estado: false, icon: Wrench }
]

export default function AdminServicios() {
  const [servicios, setServicios] = useState(mockServicios)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => servicios.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase())),
    [servicios, search]
  )

  const toggleEstado = (id) =>
    setServicios((prev) =>
      prev.map((s) => (s.idServicio === id ? { ...s, estado: !s.estado } : s))
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600">Configura tarifas y disponibilidad</p>
        </div>
        <button className="btn-primary inline-flex items-center text-base px-4 py-2">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo servicio
        </button>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicio..."
            className="input-field"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((servicio) => {
            const Icon = servicio.icon || Wrench
            return (
              <div
                key={servicio.idServicio}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{servicio.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      {servicio.tipo} · Tarifa: {servicio.tarifa}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEstado(servicio.idServicio)}
                  className={`inline-flex items-center px-3 py-2 rounded text-sm font-semibold ${
                    servicio.estado ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <ToggleRight className="w-4 h-4 mr-1" />
                  {servicio.estado ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            )
          })}
          {!filtered.length && <p className="text-center text-gray-500">Sin servicios.</p>}
        </div>
      </div>
    </div>
  )
}
