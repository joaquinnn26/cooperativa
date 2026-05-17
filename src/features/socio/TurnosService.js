import api from '@/config/api';

// Función para mandar el turno nuevo al Backend de C#
export const crearTurno = async (datosTurno) => {
  try {
    // Esto hace un POST enviando el JSON al endpoint de tu compañero
    const response = await api.post('/turnos', datosTurno);
    return response.data;
  } catch (error) {
    console.error('Error en el servicio de turnos:', error);
    throw error;
  }
};