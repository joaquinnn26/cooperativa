import React, { useState } from 'react'
import { ClipboardList, Save } from 'lucide-react'

const initialRows = [
  { id: 1, socio: 'Juan Pérez', servicio: 'Agua', lecturaAnterior: 120, lecturaActual: '' },
  { id: 2, socio: 'María Gómez', servicio: 'Luz', lecturaAnterior: 320, lecturaActual: '' }
]

export default function AdminLecturas() {
  const [rows, setRows] = useState(initialRows)

  const updateLectura = (id, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, lecturaActual: value } : r)))
  }

  const guardar = () => alert('Lecturas guardadas (demo)')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lecturas de medidores</h1>
          <p className="text-gray-600">Ingresa consumos para facturación</p>
        </div>
        <button onClick={guardar} className="btn-primary inline-flex items-center px-4 py-2">
          <Save className="w-4 h-4 mr-2" />
          Guardar lecturas
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Lectura anterior</th>
              <th className="px-4 py-3">Lectura actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500" />
                  {r.socio}
                </td>
                <td className="px-4 py-3">{r.servicio}</td>
                <td className="px-4 py-3">{r.lecturaAnterior}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={r.lecturaActual}
                    onChange={(e) => updateLectura(r.id, e.target.value)}
                    className="border rounded px-3 py-2 w-32"
                    placeholder="Nueva"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
