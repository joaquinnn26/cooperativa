import api from '@/config/api';

// Función para traer todos los turnos que pidieron los socios
export const obtenerTodosLosTurnos = async () => {
  try {
    const response = await api.get('/admin/turnos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    throw error;
  }
};

// Función para cambiar el estado (Aprobar/Rechazar)
export const actualizarEstadoTurno = async (id, nuevoEstadoId) => {
  try {
    // Le envía a C# el ID del turno y el número de estado (ej: 2=Aprobado, 3=Rechazado)
    const response = await api.put(`/admin/turnos/${id}`, { estadoId: nuevoEstadoId });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    throw error;
  }
};