import React, { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import useAppStore from '@/store/appStore.js'
import { obtenerTurnosPorSocio } from '../TurnosService'

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)

  const userString = localStorage.getItem('user') || localStorage.getItem('usuario')
  const user = userString ? JSON.parse(userString) : null
  const idSocio = user?.idSocio || user?.id || 999

  useEffect(() => {
    const cargarTurnos = async () => {
      try {
        const datos = await obtenerTurnosPorSocio(idSocio)
        setTurnos(datos || [])
      } catch (error) {
        console.error('Error al cargar turnos:', error)
      } finally {
        setLoading(false)
      }
    }
    cargarTurnos()
  }, [idSocio])

  if (loading) return <div className="text-center mt-10 text-white">Cargando...</div>

  return (
    <div className="flex flex-col items-center justify-start min-h-screen text-white pt-10">
      <BackToSocioDashboard />
      <div className="w-full max-w-4xl p-8 bg-white text-black rounded-lg shadow-md mt-6">
        <h1 className="text-3xl font-bold mb-6 text-left">Mis Turnos</h1>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Solicitada</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Propuesta Admin</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Accion</th>
              </tr>
            </thead>
            <tbody>
              {/* Quitamos la validación del length y mapeamos directo con un salvavidas por si viene objeto */}
              {(Array.isArray(turnos) ? turnos : []).map((turno) => (
                <tr key={turno.id || turno.Id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900">{turno.fecha || turno.Fecha}</td>
                  <td className="p-4 text-sm text-gray-900">{turno.hora || turno.Hora}</td>
                  <td className="p-4 text-sm text-amber-600 font-medium">
                    {(turno.fechaPropuesta || turno.FechaPropuesta) ? `${turno.fechaPropuesta || turno.FechaPropuesta} a las ${turno.horaPropuesta || turno.HoraPropuesta}` : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{turno.motivo || turno.Motivo}</td>
                  <td className="p-4 text-sm text-gray-900">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                      {turno.estado || turno.Estado}
                    </span>
                  </td>
                                    
                      
                          <td className="p-4 text-sm text-center">
                    {(turno.fechaPropuesta || turno.FechaPropuesta) && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium">
                        <button onClick={async () => { try { await aceptarPropuestaBackend(turno.id || turno.IdTurno); alert('¡Propuesta de horario aceptada con éxito!'); window.location.reload(); } catch (e) { alert('Hubo un problema en el servidor.'); } }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium">Aceptar Horario</button>
                      </button>
                    )}
                  </td>




                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
