import React from 'react'
import { formatDate } from '@/utils/formatDate.js'

export default function ReclamoModalDetalle({ reclamo, onClose }) {
  if (!reclamo) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold mb-4">Detalle del Reclamo</h2>

        <div className="space-y-2 text-gray-800">
          <p>
            <strong>ID:</strong> {reclamo.idReclamo}
          </p>
          <p>
            <strong>Tipo:</strong> {reclamo.Tipo || reclamo.tipoReclamo}
          </p>
          <p>
            <strong>Fecha:</strong> {formatDate(reclamo.Fecha || reclamo.fecha, 'es-AR')}
          </p>
          <p>
            <strong>Estado:</strong> {reclamo.Estado || reclamo.estado}
          </p>
          <p>
            <strong>Descripción:</strong>
          </p>
          <p className="bg-gray-100 p-3 rounded">{reclamo.Descripcion || 'Sin descripción'}</p>
        </div>
      </div>
    </div>
  )
}
