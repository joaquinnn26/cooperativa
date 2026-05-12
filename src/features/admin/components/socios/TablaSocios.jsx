import React from 'react'

export default function TablaSocios({ socios, onEditar, onEliminar, onToggleEstado }) {
  return (
    <table className="w-full border rounded">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-3 py-2">ID</th>
          <th className="px-3 py-2">Nombre</th>
          <th className="px-3 py-2">Documento</th>
          <th className="px-3 py-2">Teléfono</th>
          <th className="px-3 py-2">Email</th>
          <th className="px-6 py-3 text-center">Estado</th>
          <th className="px-3 py-2 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {socios.map((socio) => (
          <tr key={socio.idSocio} className="border-b hover:bg-gray-50">
            <td className="px-3 py-2">{socio.idSocio}</td>
            <td className="px-3 py-2">
              {socio.Persona?.Nombre} {socio.Persona?.Apellido}
            </td>
            <td className="px-3 py-2">{socio.Persona?.Documento}</td>
            <td className="px-3 py-2">{socio.Persona?.Telefono}</td>
            <td className="px-3 py-2">{socio.Persona?.Email}</td>
            <td className="px-6 py-3 text-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!socio.Activo}
                  onChange={() => onToggleEstado(socio)}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 relative transition">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition" />
                </div>
              </label>
            </td>
            <td className="px-3 py-2 text-center space-x-2">
              <button onClick={() => onEditar(socio)} className="text-blue-600 hover:text-blue-800">
                ✏️
              </button>
              <button onClick={() => onEliminar(socio)} className="text-red-600 hover:text-red-800">
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
