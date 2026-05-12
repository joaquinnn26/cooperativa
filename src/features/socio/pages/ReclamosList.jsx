import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, PlusCircle } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useReclamos } from '@/hooks/useReclamos.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { formatDate } from '@/utils/formatDate.js'
import ReclamoModalDetalle from '@/features/socio/components/reclamos/ReclamoModalDetalle.jsx'

export default function ReclamosList() {
  const { socioId, loadingSocio } = useCurrentSocio()
  const { reclamos, loading } = useReclamos(socioId)
  const [filter, setFilter] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  const filtered = useMemo(
    () =>
      reclamos.filter((r) =>
        `${r.Tipo} ${r.Descripcion || ''}`.toLowerCase().includes(filter.toLowerCase())
      ),
    [reclamos, filter]
  )

  const isLoading = loading || loadingSocio

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackToSocioDashboard />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Reclamos</h1>
          <p className="text-gray-600">Revisa el estado de tus reclamos</p>
        </div>
        <Link
          to="/socio/reclamos/nuevo"
          className="inline-flex items-center btn-primary text-base px-5 py-3"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo reclamo
        </Link>
      </div>

      <div className="card">
        <div className="flex justify-between mb-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por tipo o descripción..."
            className="input-field"
          />
        </div>

        {isLoading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reclamo) => (
                  <tr key={reclamo.idReclamo} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3">{reclamo.idReclamo}</td>
                    <td className="px-6 py-3">{reclamo.Tipo}</td>
                    <td className="px-6 py-3">{formatDate(reclamo.Fecha, 'es-AR')}</td>
                    <td className="px-6 py-3">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {reclamo.Estado}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                        onClick={() => setSeleccionado(reclamo)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <p className="text-center text-gray-500 py-6">No hay reclamos que coincidan.</p>
            )}
          </div>
        )}
      </div>

      <ReclamoModalDetalle reclamo={seleccionado} onClose={() => setSeleccionado(null)} />
    </div>
  )
}
