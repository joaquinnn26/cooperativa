import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SERVICE_REQUEST_STATUSES = [
  'Pendiente',
  'En revision',
  'En proceso',
  'Aceptada',
  'Terminada',
  'Cancelada'
]

const LOCKED_REQUEST_STATUSES = ['Aceptada', 'Terminada', 'Cancelada']

const INITIAL_REQUESTS = [
  {
    id: 1,
    codigo: 'SOL-1001',
    socioUsuario: '30111222',
    socioNombre: 'Socio Demo',
    servicio: 'Luz',
    motivo: 'Alta nueva',
    descripcion: 'Solicito el alta del servicio electrico para mi domicilio.',
    domicilio: 'Av. Siempre Viva 123',
    telefonoContacto: '3515550001',
    estado: 'Pendiente',
    fechaSolicitud: '2026-05-10T10:30:00.000Z',
    fechaActualizacion: '2026-05-10T10:30:00.000Z',
    numeroMedidor: '',
    observacionesAdmin: '',
    documentos: [
      {
        id: 'doc-1',
        nombre: 'dni-frente.pdf',
        tipo: 'application/pdf',
        tamano: 240000
      }
    ]
  }
]

function buildRequestCode(requests) {
  const lastId = requests.reduce((max, request) => Math.max(max, request.id), 1000)
  return `SOL-${String(lastId + 1)}`
}

function buildMeterNumber(requests) {
  const lastMeter = requests.reduce((max, request) => {
    if (!request.numeroMedidor) return max
    const numeric = Number(String(request.numeroMedidor).replace(/\D/g, ''))
    return Number.isNaN(numeric) ? max : Math.max(max, numeric)
  }, 49999)

  return `MED-${lastMeter + 1}`
}

const useServiceRequestStore = create(
  persist(
    (set, get) => ({
      requests: INITIAL_REQUESTS,

      createServiceRequest: async (payload) => {
        const requests = get().requests
        const nextId = requests.length ? Math.max(...requests.map((request) => request.id)) + 1 : 1
        const timestamp = new Date().toISOString()

        const newRequest = {
          id: nextId,
          codigo: buildRequestCode(requests),
          socioUsuario: payload.socioUsuario,
          socioNombre: payload.socioNombre || payload.socioUsuario,
          servicio: payload.servicio,
          motivo: payload.motivo,
          descripcion: payload.descripcion,
          domicilio: payload.domicilio,
          telefonoContacto: payload.telefonoContacto,
          estado: 'Pendiente',
          fechaSolicitud: timestamp,
          fechaActualizacion: timestamp,
          numeroMedidor: '',
          observacionesAdmin: '',
          documentos: payload.documentos || []
        }

        set((state) => ({
          requests: [newRequest, ...state.requests]
        }))

        return newRequest
      },

      fetchServiceRequestsBySocio: async (socioUsuario) => {
        return get().requests.filter((request) => String(request.socioUsuario) === String(socioUsuario))
      },

      fetchAllServiceRequests: async () => {
        return get().requests
      },

      updateServiceRequestStatus: async (requestId, payload) => {
        if (!SERVICE_REQUEST_STATUSES.includes(payload.estado)) {
          throw new Error('Estado de solicitud no valido.')
        }

        const currentRequest = get().requests.find((request) => request.id === requestId)
        if (!currentRequest) {
          throw new Error('Solicitud no encontrada.')
        }

        if (LOCKED_REQUEST_STATUSES.includes(currentRequest.estado)) {
          throw new Error('La solicitud ya fue cerrada y no puede modificarse.')
        }

        const generatedMeter =
          currentRequest.servicio === 'Luz' && payload.estado === 'Aceptada'
            ? buildMeterNumber(get().requests)
            : ''

        set((state) => ({
          requests: state.requests.map((request) => {
            if (request.id !== requestId) return request

            return {
              ...request,
              estado: payload.estado,
              observacionesAdmin: payload.observacionesAdmin ?? request.observacionesAdmin,
              numeroMedidor:
                request.servicio === 'Luz' && payload.estado === 'Aceptada'
                  ? generatedMeter
                  : request.numeroMedidor || '',
              fechaActualizacion: new Date().toISOString()
            }
          })
        }))
      }
    }),
    {
      name: 'cooperativa-service-requests'
    }
  )
)

export { SERVICE_REQUEST_STATUSES }
export { LOCKED_REQUEST_STATUSES }
export default useServiceRequestStore
