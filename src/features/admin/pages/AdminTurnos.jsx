import React, { useEffect, useState } from 'react'
import { actualizarEstadoTurno, obtenerTodosLosTurnos } from './TurnosAdminService.js'

export default function AdminTurnos() {
  const [turnos, setTurnos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarTurnos = async () => {
      try {
        const datos = await obtenerTodosLosTurnos()
        setTurnos(datos)
      } catch (error) {
        setTurnos([
          {
            id: 1,
            socio: 'Emiliano Inversiones',
            fecha: '2026-05-20',
            hora: '10:30',
            motivo: 'Consulta reconexion',
            estado: 'Pendiente'
          }
        ])
      } finally {
        setCargando(false)
      }
    }

    cargarTurnos()
  }, [])

  const actualizarVista = (id, nombreEstado, cambios = {}) => {
    setTurnos((prev) =>
      prev.map((turno) => (turno.id === id ? { ...turno, ...cambios, estado: nombreEstado } : turno))
    )
  }

  const handleAprobar = async (id) => {
    try {
      await actualizarEstadoTurno(id, 2)
      actualizarVista(id, 'Aprobado')
      alert(`Turno Nro ${id} aprobado`)
    } catch (error) {
      alert('Error al cambiar el estado en el servidor. Modificando vista local...')
      actualizarVista(id, 'Aprobado')
    }
  }

  const handleProponer = async (id) => {
    const fechaPropuesta = window.prompt('Ingrese la nueva fecha disponible (AAAA-MM-DD)')
    if (!fechaPropuesta) return

    const horaPropuesta = window.prompt('Ingrese la nueva hora disponible (HH:MM)')
    if (!horaPropuesta) return

    const cambios = {
      fechaPropuesta,
      FechaPropuesta: fechaPropuesta,
      horaPropuesta,
      HoraPropuesta: horaPropuesta,
      estado: 'Propuesto'
    }

    try {
      await actualizarEstadoTurno(id, 3, cambios)
      actualizarVista(id, 'Propuesto', cambios)
      alert(`Turno Nro ${id} marcado como propuesto`)
    } catch (error) {
      alert('Error al guardar la propuesta en el servidor. Modificando vista local...')
      actualizarVista(id, 'Propuesto', cambios)
    }
  }

  if (cargando) {
    return <div className="text-center mt-10">Cargando turnos de la cooperativa...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md border mt-10 text-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-blue-600 text-center">
        Panel - Gestion de Turnos (COSPRAL)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 font-semibold text-sm">Socio</th>
              <th className="p-3 font-semibold text-sm">Fecha</th>
              <th className="p-3 font-semibold text-sm">Hora</th>
              <th className="p-3 font-semibold text-sm">Propuesta Admin</th>
              <th className="p-3 font-semibold text-sm">Motivo</th>
              <th className="p-3 font-semibold text-sm">Estado</th>
              <th className="p-3 font-semibold text-sm text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => (
              <tr key={turno.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{turno.socio}</td>
                <td className="p-3 text-sm">{turno.fecha}</td>
                <td className="p-3 text-sm">{turno.hora}</td>
                <td className="p-3 text-sm">
                  {turno.fechaPropuesta && turno.horaPropuesta
                    ? `${turno.fechaPropuesta} ${turno.horaPropuesta}`
                    : '-'}
                </td>
                <td className="p-3 text-sm">{turno.motivo}</td>
                <td className="p-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      turno.estado === 'Pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : turno.estado === 'Aprobado' || turno.estado === 'Aceptado'
                          ? 'bg-green-100 text-green-800'
                          : turno.estado === 'Propuesto'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {turno.estado}
                  </span>
                </td>
                <td className="p-3 text-sm text-center space-x-2">
                  {turno.estado === 'Pendiente' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAprobar(turno.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProponer(turno.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Proponer otro
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!turnos.length ? (
          <div className="text-center py-10 text-gray-500">No hay turnos pendientes</div>
        ) : null}
      </div>
    </div>
  )
}
