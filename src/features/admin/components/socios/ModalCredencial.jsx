import React from 'react'

export default function ModalCredencial({ show, credenciales, onClose }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Socio creado</h2>
        <p className="text-gray-600 mb-4">Se creó el usuario y contraseña temporal:</p>

        <div className="bg-gray-100 p-4 rounded mb-4">
          <p>
            <strong>Usuario:</strong> {credenciales.usuario}
          </p>
          <p>
            <strong>Contraseña temporal:</strong> {credenciales.password}
          </p>
        </div>

        <p className="text-sm text-gray-500">
          ⚠️ La contraseña no podrá volver a verse. Debe cambiarse en el primer ingreso.
        </p>

        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
