import React, { useEffect, useState } from 'react'
import { useSocios } from '@/hooks/useSocios.js'

export default function ModalEditarSocio({ show, socio, onClose, onRefresh }) {
  const { servicios, fetchServicios, editarSocio, asignarServicios } = useSocios(false)
  const [form, setForm] = useState({ Nombre: '', Apellido: '', ServiciosSeleccionados: [] })

  useEffect(() => {
    if (show) {
      fetchServicios()
      if (socio) {
        setForm({
          Nombre: socio.Persona?.Nombre || '',
          Apellido: socio.Persona?.Apellido || '',
          ServiciosSeleccionados: socio.Servicios?.map((s) => s.idServicio) || []
        })
      }
    }
  }, [show, socio, fetchServicios])

  const toggleServicio = (id) => {
    setForm((prev) => ({
      ...prev,
      ServiciosSeleccionados: prev.ServiciosSeleccionados.includes(id)
        ? prev.ServiciosSeleccionados.filter((s) => s !== id)
        : [...prev.ServiciosSeleccionados, id]
    }))
  }

  const guardar = async () => {
    if (!socio) return
    await editarSocio(socio.idSocio, { Nombre: form.Nombre, Apellido: form.Apellido })
    await asignarServicios(socio.idSocio, form.ServiciosSeleccionados)
    onRefresh?.()
    onClose()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Editar socio</h2>

        <div className="space-y-3">
          <input
            value={form.Nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, Nombre: e.target.value }))}
            placeholder="Nombre"
            className="input-field"
          />
          <input
            value={form.Apellido}
            onChange={(e) => setForm((prev) => ({ ...prev, Apellido: e.target.value }))}
            placeholder="Apellido"
            className="input-field"
          />

          <div>
            <p className="font-semibold mb-1">Servicios asociados</p>
            <div className="flex flex-col space-y-1 max-h-40 overflow-y-auto">
              {servicios.map((servicio) => (
                <label key={servicio.idServicio} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.ServiciosSeleccionados.includes(servicio.idServicio)}
                    onChange={() => toggleServicio(servicio.idServicio)}
                  />
                  <span>{servicio.Nombre}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={guardar} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
