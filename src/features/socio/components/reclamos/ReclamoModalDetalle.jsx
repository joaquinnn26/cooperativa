import React, { useEffect, useState } from 'react'
import { laboralApi, tareaEstados } from '@/utils/laboral.js'
import { formatDate } from '@/utils/formatDate.js'

export default function ReclamoModalDetalle({ reclamo, onClose }) {
  const [tracking, setTracking] = useState([]), [error, setError] = useState('')
  useEffect(() => {
    if (!reclamo) return
    const abort = new AbortController(); setTracking([]); setError('')
    laboralApi(`/seguimiento/reclamo/${reclamo.idReclamo}`, { signal: abort.signal }).then(setTracking).catch(e => { if (!abort.signal.aborted) setError(e.message) })
    return () => abort.abort()
  }, [reclamo?.idReclamo])
  if (!reclamo) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-auto">
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
          <h3 className="font-semibold pt-4">Seguimiento por área</h3>
          {error && <p role="alert">{error}</p>}
          {tracking.map((t, i) => <div key={i} className="rounded border p-3"><strong>{t.AreaNombre || t.Area}</strong><p>{tareaEstados[t.Estado] || t.Estado}</p><p>Actualizado: {new Date(t.FechaActualizacionUtc).toLocaleString('es-AR')}</p>{t.Resultado && <p>{t.Resultado}</p>}{t.FechaCierreUtc && <p>Finalizado: {new Date(t.FechaCierreUtc).toLocaleString('es-AR')}</p>}</div>)}
          {!error && !tracking.length && <p>El reclamo está registrado y aún no tiene una intervención asignada a un área.</p>}
        </div>
      </div>
    </div>
  )
}
