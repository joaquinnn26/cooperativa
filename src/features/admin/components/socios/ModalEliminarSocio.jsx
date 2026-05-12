import React from 'react'

export default function ModalEliminarSocio({ show, socio, onClose, onConfirm }) {
  if (!show || !socio) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl text-center">
        <h2 className="text-lg font-bold mb-4">¿Eliminar socio?</h2>
        <p className="mb-6 text-gray-700">
          Estás a punto de eliminar a <strong>{socio.Persona?.Nombre} {socio.Persona?.Apellido}</strong>
        </p>
        <div className="flex justify-center space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
