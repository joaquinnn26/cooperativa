import React, { useState, useEffect } from 'react';
import { obtenerTodosLosTurnos, actualizarEstadoTurno } from '../TurnosAdminService';

export default function AdminTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Trae los turnos reales de SQL Server al abrir la pantalla
  useEffect(() => {
    const cargarTurnos = async () => {
      try {
        const datos = await obtenerTodosLosTurnos();
        setTurnos(datos);
      } catch (error) {
        // Si falla la API, dejamos unos de prueba para el entorno académico
        setTurnos([
          { id: 1, socio: "Emiliano Inversiones", fecha: "2026-05-20", hora: "10:30", motivo: "Consulta reconexión", estado: "Pendiente" }
        ]);
      } finally {
        setCargando(false);
      }
    };
    cargarTurnos();
  }, []);

  const handleAccion = async (id, nuevoEstadoId, nombreEstado) => {
    try {
      await actualizarEstadoTurno(id, nuevoEstadoId);
      setTurnos(turnos.map(t => t.id === id ? { ...t, estado: nombreEstado } : t));
      alert(`Turno N°${id} cambiado a: ${nombreEstado}`);
    } catch (error) {
      alert('Error al cambiar el estado en el servidor. Modificando vista local...');
      setTurnos(turnos.map(t => t.id === id ? { ...t, estado: nombreEstado } : t));
    }
  };

  if (cargando) return <div className="text-center mt-10">Cargando turnos de la cooperativa...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md border mt-10 text-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-blue-600 text-center">Panel - Gestión de Turnos (COSPRAL)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 font-semibold text-sm">Socio</th>
              <th className="p-3 font-semibold text-sm">Fecha</th>
              <th className="p-3 font-semibold text-sm">Hora</th>
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
                <td className="p-3 text-sm">{turno.motivo}</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    turno.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    turno.estado === 'Aprobado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {turno.estado}
                  </span>
                </td>
                <td className="p-3 text-sm text-center space-x-2">
                  {turno.estado === 'Pendiente' && (
                    <>
                      <button onClick={() => handleAccion(turno.id, 2, 'Aprobado')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                        Aprobar
                      </button>
                      <button onClick={() => handleAccion(turno.id, 3, 'Rechazado')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">
                        Rechazar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}