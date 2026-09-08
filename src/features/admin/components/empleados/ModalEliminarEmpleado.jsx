import React from 'react'

export default function ModalEliminarEmpleado({ show, empleado, onClose, onConfirm }) {
  if (!show || !empleado) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <h2 className="mb-4 text-lg font-bold">Eliminar empleado</h2>
        <p className="mb-6 text-gray-700">
          Se eliminara a <strong>{empleado.Persona?.Nombre} {empleado.Persona?.Apellido}</strong>.
        </p>
        <div className="flex justify-center space-x-2">
          <button onClick={onClose} className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
