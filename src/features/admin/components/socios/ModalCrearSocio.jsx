import React, { useEffect, useState } from 'react'
import { useServicios } from '@/hooks/useServicios.js'
import { useSocios } from '@/hooks/useSocios.js'
import { apiUrl } from '@/config/api.js'

export default function ModalCrearSocio({ show, onClose, onSaved }) {
  const { servicios, loadingServicios, fetchServicios } = useServicios(false)
  const { crearSocio } = useSocios(false)

  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [form, setForm] = useState({
    Nombre: '',
    Apellido: '',
    Documento: '',
    Telefono: '',
    Email: '',
    Calle: '',
    Numero: ''
  })

  useEffect(() => {
    if (show) fetchServicios()
  }, [show, fetchServicios])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleServicio = (id) => {
    setServiciosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      const socio = await crearSocio(form)

      if (serviciosSeleccionados.length && socio?.idSocio) {
        await fetch(apiUrl(`/serviciosocio/${socio.idSocio}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviciosSeleccionados)
        })
      }

      window.alert(
        `Socio creado correctamente.\n\nUsuario: ${socio?.usuario ?? form.Documento}\nContraseña temporal: ${socio?.passwordTemporal ?? ''}`
      )

      setForm({
        Nombre: '',
        Apellido: '',
        Documento: '',
        Telefono: '',
        Email: '',
        Calle: '',
        Numero: ''
      })
      setServiciosSeleccionados([])
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Error al crear socio', error)
      window.alert(`No se pudo crear el socio.\n\n${error.message}`)
    }
  }

  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            ✖
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Agregar Nuevo Socio</h2>

          <form onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Nombre', 'Apellido', 'Documento', 'Telefono', 'Email', 'Calle', 'Numero'].map(
                (field) => (
                  <input
                    key={field}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    placeholder={field}
                    required={['Nombre', 'Apellido', 'Documento'].includes(field)}
                    className="input-field"
                  />
                )
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-2">Servicios asociados</h3>

              {loadingServicios ? (
                <div className="text-gray-500">Cargando servicios...</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {servicios.map((servicio) => (
                    <label
                      key={servicio.idServicio}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={serviciosSeleccionados.includes(servicio.idServicio)}
                        onChange={() => toggleServicio(servicio.idServicio)}
                      />
                      <span>{servicio.Nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
