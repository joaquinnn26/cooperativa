import React, { useState } from 'react';
import { crearTurno } from './TurnosService';

export default function TurnoNuevo() {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fecha || !hora || !motivo) {
      return alert('Por favor, completa todos los campos obligatorios.');
    }
    
    try {
      // Mandamos los datos usando el servicio nuevo
      await crearTurno({ fecha, hora, motivo, estadoTurnoId: 1 }); // 1 = Pendiente
      alert('¡Turno solicitado con éxito!');
      
      // Limpiamos los campos
      setFecha('');
      setHora('');
      setMotivo('');
    } catch (error) {
      alert('Hubo un error al conectar con el servidor.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border mt-10 text-gray-800">
      <h2 className="text-xl font-bold mb-4 text-center text-blue-600">Solicitar Nuevo Turno</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Seleccionar Fecha</label>
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Seleccionar Hora</label>
          <input 
            type="time" 
            value={hora} 
            onChange={(e) => setHora(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Motivo de la Solicitud</label>
          <textarea 
            value={motivo} 
            onChange={(e) => setMotivo(e.target.value)} 
            placeholder="Escribe aquí el motivo del turno..." 
            rows="3" 
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Confirmar Solicitud de Turno
        </button>
      </form>
    </div>
  );
}
