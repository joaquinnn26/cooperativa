import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'

export default function TablaEmpleados({ empleados, onEditar, onEliminar, onToggleEstado }) {
  return (
    <table className="w-full border rounded">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-3 py-2">ID</th>
          <th className="px-3 py-2">Nombre</th>
          <th className="px-3 py-2">Documento</th>
          <th className="px-3 py-2">Cargo</th>
          <th className="px-3 py-2">Telefono</th>
          <th className="px-3 py-2">Email</th>
          <th className="px-6 py-3 text-center">Estado</th>
          <th className="px-3 py-2 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {empleados.map((empleado) => (
          <tr key={empleado.idEmpleado} className="border-b hover:bg-gray-50">
            <td className="px-3 py-2">{empleado.idEmpleado}</td>
            <td className="px-3 py-2">
              {empleado.Persona?.Nombre} {empleado.Persona?.Apellido}
            </td>
            <td className="px-3 py-2">{empleado.Persona?.Documento}</td>
            <td className="px-3 py-2">{empleado.Cargo?.Nombre}</td>
            <td className="px-3 py-2">{empleado.Persona?.Telefono || '-'}</td>
            <td className="px-3 py-2">{empleado.Persona?.Email || '-'}</td>
            <td className="px-6 py-3 text-center">
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={!!empleado.Activo}
                  onChange={() => onToggleEstado(empleado)}
                />
                <div className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-green-500">
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </div>
              </label>
            </td>
            <td className="space-x-2 px-3 py-2 text-center">
              <button onClick={() => onEditar(empleado)} className="text-blue-600 hover:text-blue-800">
                <Pencil className="inline h-4 w-4" />
              </button>
              <button onClick={() => onEliminar(empleado)} className="text-red-600 hover:text-red-800">
                <Trash2 className="inline h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
