import React from 'react'

export default function ModalEliminarSocio({ show, socio, onClose, onConfirm }) {
  if (!show || !socio) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <h2 className="mb-4 text-lg font-bold">Dar de baja socio</h2>
        <p className="mb-6 text-gray-700">
          Vas a marcar como inactivo a <strong>{socio.Persona?.Nombre} {socio.Persona?.Apellido}</strong>. No se eliminan sus registros historicos.
        </p>
        <div className="flex justify-center space-x-2">
          <button type="button" onClick={onClose} className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Dar de baja
          </button>
        </div>
      </div>
    </div>
  )
}
