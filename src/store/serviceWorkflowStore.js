import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiUrl } from '@/config/api.js'

const SERVICE_REQUEST_STATUSES = ['Pendiente', 'En revision', 'Aprobada', 'Rechazada']

const mockServices = [
  {
    idServicio: 1,
    Nombre: 'Agua',
    Descripcion: 'Servicio de agua potable domiciliaria',
    TarifaBase: 2500,
    Activo: true,
    TipoMedidor: 'Caudalimetro'
  },
  {
    idServicio: 2,
    Nombre: 'Luz',
    Descripcion: 'Servicio electrico residencial',
    TarifaBase: 1800,
    Activo: true,
    TipoMedidor: 'Electromecanico'
  }
]

const mockRequirements = [
  {
    idRequisitoServicio: 1,
    idServicio: 1,
    Nombre: 'DNI del titular',
    Descripcion: 'Frente y dorso del documento vigente.',
    Activo: true
  },
  {
    idRequisitoServicio: 2,
    idServicio: 1,
    Nombre: 'Constancia de domicilio',
    Descripcion: 'Boleta o certificado de domicilio reciente.',
    Activo: true
  },
  {
    idRequisitoServicio: 3,
    idServicio: 2,
    Nombre: 'DNI del titular',
    Descripcion: 'Frente y dorso del documento vigente.',
    Activo: true
  },
  {
    idRequisitoServicio: 4,
    idServicio: 2,
    Nombre: 'Plano o croquis',
    Descripcion: 'Ubicacion del punto de conexion electrica.',
    Activo: true
  }
]

const mockRequests = [
  {
    idSolicitudServicio: 1,
    socioUsuario: '30111222',
    socioNombre: 'Maria Gonzalez',
    idServicio: 2,
    servicioNombre: 'Luz',
    fechaSolicitud: '2026-05-12T09:00:00.000Z',
    estado: 'Pendiente',
    observaciones: 'Solicito alta para vivienda nueva.',
    motivoRechazo: '',
    documentos: [
      {
        id: 'doc-1',
        nombre: 'dni.pdf',
        tipo: 'application/pdf',
        tamano: 204800
      }
    ]
  }
]

const mockAssignments = []
const mockMeters = []
const mockMeasurements = []

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token')
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extraHeaders
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: getAuthHeaders(options.headers || {}),
    ...options
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `HTTP ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

async function formDataFetch(url, formData, options = {}) {
  const headers = getAuthHeaders(options.headers || {})
  delete headers['Content-Type']

  const res = await fetch(url, {
    method: 'POST',
    ...options,
    headers,
    body: formData
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `HTTP ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

function nextId(items, key) {
  return items.length ? Math.max(...items.map((item) => Number(item[key]) || 0)) + 1 : 1
}

function normalizeService(service) {
  return {
    idServicio: pickFirst(service.idServicio, service.IdServicio, service.id),
    Nombre: pickFirst(service.Nombre, service.nombre, service.Servicio, service.servicio, 'Servicio'),
    Descripcion: pickFirst(service.Descripcion, service.descripcion, ''),
    TarifaBase: Number(pickFirst(service.TarifaBase, service.tarifaBase, service.Tarifa, service.tarifa, 0)),
    Activo: Boolean(pickFirst(service.Activo, service.activo, true)),
    TipoMedidor: pickFirst(service.TipoMedidor, service.tipoMedidor, service.Tipo, service.tipo, 'General')
  }
}

function normalizeRequirement(requirement) {
  return {
    idRequisitoServicio: pickFirst(
      requirement.idRequisitoServicio,
      requirement.IdRequisitoServicio,
      requirement.id,
      requirement.idRequisito
    ),
    idServicio: Number(pickFirst(requirement.idServicio, requirement.IdServicio, requirement.idservicio)),
    Nombre: pickFirst(requirement.Nombre, requirement.nombre, requirement.Requisito, requirement.requisito, 'Requisito'),
    Descripcion: pickFirst(requirement.Descripcion, requirement.descripcion, ''),
    Activo: Boolean(pickFirst(requirement.Activo, requirement.activo, true))
  }
}

function normalizeRequest(request) {
  return {
    idSolicitudServicio: pickFirst(request.idSolicitudServicio, request.IdSolicitudServicio, request.id),
    socioUsuario: String(pickFirst(request.socioUsuario, request.SocioUsuario, request.usuario, request.Documento, '')),
    socioNombre: pickFirst(request.socioNombre, request.SocioNombre, request.NombreSocio, request.nombreSocio, 'Socio'),
    idServicio: Number(pickFirst(request.idServicio, request.IdServicio, request.idservicio)),
    servicioNombre: pickFirst(
      request.servicioNombre,
      request.ServicioNombre,
      request.Servicio,
      request.servicio,
      request.NombreServicio,
      request.nombreServicio,
      'Servicio'
    ),
    fechaSolicitud: pickFirst(request.fechaSolicitud, request.FechaSolicitud, request.fecha, new Date().toISOString()),
    estado: pickFirst(request.estado, request.Estado, 'Pendiente'),
    observaciones: pickFirst(request.observaciones, request.Observaciones, ''),
    motivoRechazo: pickFirst(request.motivoRechazo, request.MotivoRechazo, ''),
    documentos: ensureArray(pickFirst(request.documentos, request.Documentos, []))
  }
}

function normalizeAssignment(assignment) {
  return {
    idServicioSocio: pickFirst(assignment.idServicioSocio, assignment.IdServicioSocio, assignment.id),
    socioUsuario: String(pickFirst(assignment.socioUsuario, assignment.SocioUsuario, assignment.usuario, '')),
    socioNombre: pickFirst(assignment.socioNombre, assignment.SocioNombre, assignment.nombreSocio, 'Socio'),
    idServicio: Number(pickFirst(assignment.idServicio, assignment.IdServicio, assignment.idservicio)),
    servicioNombre: pickFirst(assignment.servicioNombre, assignment.ServicioNombre, assignment.Servicio, 'Servicio'),
    tarifa: Number(pickFirst(assignment.tarifa, assignment.Tarifa, assignment.tarifaBase, 0)),
    estado: pickFirst(assignment.estado, assignment.Estado, 'Activo'),
    idMedidor: pickFirst(assignment.idMedidor, assignment.IdMedidor, null),
    numeroMedidor: pickFirst(assignment.numeroMedidor, assignment.NumeroMedidor, ''),
    tipoMedidor: pickFirst(assignment.tipoMedidor, assignment.TipoMedidor, '')
  }
}

function normalizeMeter(meter) {
  return {
    idMedidor: pickFirst(meter.idMedidor, meter.IdMedidor, meter.id),
    NumeroMedidor: pickFirst(meter.NumeroMedidor, meter.numeroMedidor, meter.Numero, meter.numero, ''),
    idServicioSocio: pickFirst(meter.idServicioSocio, meter.IdServicioSocio, null),
    socioUsuario: String(pickFirst(meter.socioUsuario, meter.SocioUsuario, meter.usuario, '')),
    socioNombre: pickFirst(meter.socioNombre, meter.SocioNombre, 'Socio'),
    idServicio: Number(pickFirst(meter.idServicio, meter.IdServicio, meter.idservicio, 0)),
    servicioNombre: pickFirst(meter.servicioNombre, meter.ServicioNombre, meter.Servicio, 'Servicio'),
    TipoMedidor: pickFirst(meter.TipoMedidor, meter.tipoMedidor, meter.Tipo, 'General'),
    FechaInstalacion: pickFirst(meter.FechaInstalacion, meter.fechaInstalacion, new Date().toISOString()),
    Estado: pickFirst(meter.Estado, meter.estado, 'Activo')
  }
}

function normalizeMeasurement(measurement) {
  return {
    idMedicion: pickFirst(measurement.idMedicion, measurement.IdMedicion, measurement.id),
    idMedidor: pickFirst(measurement.idMedidor, measurement.IdMedidor),
    NumeroMedidor: pickFirst(measurement.NumeroMedidor, measurement.numeroMedidor, ''),
    socioUsuario: String(pickFirst(measurement.socioUsuario, measurement.SocioUsuario, '')),
    socioNombre: pickFirst(measurement.socioNombre, measurement.SocioNombre, 'Socio'),
    servicioNombre: pickFirst(measurement.servicioNombre, measurement.ServicioNombre, measurement.Servicio, 'Servicio'),
    FechaLectura: pickFirst(measurement.FechaLectura, measurement.fechaLectura, new Date().toISOString()),
    LecturaAnterior: Number(pickFirst(measurement.LecturaAnterior, measurement.lecturaAnterior, 0)),
    LecturaActual: Number(pickFirst(measurement.LecturaActual, measurement.lecturaActual, 0)),
    Consumo: Number(pickFirst(measurement.Consumo, measurement.consumo, 0)),
    TipoLectura: pickFirst(measurement.TipoLectura, measurement.tipoLectura, 'Manual'),
    EmpleadoUsuario: pickFirst(measurement.EmpleadoUsuario, measurement.empleadoUsuario, '')
  }
}

function fileToMetadata(file, index) {
  return {
    id: `${file.name}-${file.lastModified}-${index}`,
    nombre: file.name,
    tipo: file.type || 'application/octet-stream',
    tamano: file.size
  }
}

function generateMeterNumber(meters) {
  const lastNumeric = meters.reduce((max, meter) => {
    const numeric = Number(String(meter.NumeroMedidor || '').replace(/\D/g, ''))
    return Number.isNaN(numeric) ? max : Math.max(max, numeric)
  }, 9999)

  return `MED-${lastNumeric + 1}`
}

const useServiceWorkflowStore = create(
  persist(
    (set, get) => ({
      servicesCatalog: mockServices,
      requirementsCatalog: mockRequirements,
      requests: mockRequests,
      serviceAssignments: mockAssignments,
      meters: mockMeters,
      measurements: mockMeasurements,

      fetchServicesCatalog: async () => {
        try {
          const data = await jsonFetch(apiUrl('/servicio'))
          const normalized = ensureArray(data).map(normalizeService)
          set({ servicesCatalog: normalized })
          return normalized
        } catch {
          return get().servicesCatalog
        }
      },

      fetchRequirementsByService: async (serviceId) => {
        try {
          const data = await jsonFetch(apiUrl(`/requisitoservicio/servicio/${serviceId}`))
          const normalized = ensureArray(data).map(normalizeRequirement).filter((item) => item.Activo)
          set((state) => ({
            requirementsCatalog: [
              ...state.requirementsCatalog.filter((item) => item.idServicio !== Number(serviceId)),
              ...normalized
            ]
          }))
          return normalized
        } catch {
          return get().requirementsCatalog.filter(
            (item) => item.idServicio === Number(serviceId) && item.Activo
          )
        }
      },

      fetchAllRequirements: async () => {
        try {
          const data = await jsonFetch(apiUrl('/requisitoservicio'))
          const normalized = ensureArray(data).map(normalizeRequirement)
          set({ requirementsCatalog: normalized })
          return normalized
        } catch {
          return get().requirementsCatalog
        }
      },

      createRequirement: async (payload) => {
        try {
          const created = await jsonFetch(apiUrl('/requisitoservicio'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          await get().fetchAllRequirements()
          return created
        } catch {
          const requirement = {
            idRequisitoServicio: nextId(get().requirementsCatalog, 'idRequisitoServicio'),
            idServicio: Number(payload.idServicio),
            Nombre: payload.Nombre,
            Descripcion: payload.Descripcion,
            Activo: true
          }
          set((state) => ({
            requirementsCatalog: [requirement, ...state.requirementsCatalog]
          }))
          return requirement
        }
      },

      updateRequirement: async (requirementId, payload) => {
        try {
          const updated = await jsonFetch(apiUrl(`/requisitoservicio/${requirementId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          await get().fetchAllRequirements()
          return updated
        } catch {
          set((state) => ({
            requirementsCatalog: state.requirementsCatalog.map((item) =>
              item.idRequisitoServicio === requirementId
                ? { ...item, ...payload, idServicio: Number(payload.idServicio) }
                : item
            )
          }))
          return true
        }
      },

      toggleRequirementStatus: async (requirementId) => {
        try {
          const updated = await jsonFetch(apiUrl(`/requisitoservicio/estado/${requirementId}`), {
            method: 'PUT'
          })
          await get().fetchAllRequirements()
          return updated
        } catch {
          set((state) => ({
            requirementsCatalog: state.requirementsCatalog.map((item) =>
              item.idRequisitoServicio === requirementId
                ? { ...item, Activo: !item.Activo }
                : item
            )
          }))
          return true
        }
      },

      createServiceRequest: async (payload) => {
        try {
          const formData = new FormData()
          formData.append('idServicio', String(payload.idServicio))
          formData.append('observaciones', payload.observaciones)
          formData.append('socioUsuario', payload.socioUsuario)
          formData.append('socioNombre', payload.socioNombre)
          payload.files.forEach((file) => formData.append('archivos', file))

          const created = await formDataFetch(apiUrl('/solicitudservicio'), formData)
          return created
        } catch {
          const service = get().servicesCatalog.find((item) => item.idServicio === Number(payload.idServicio))
          const request = {
            idSolicitudServicio: nextId(get().requests, 'idSolicitudServicio'),
            socioUsuario: String(payload.socioUsuario),
            socioNombre: payload.socioNombre || payload.socioUsuario,
            idServicio: Number(payload.idServicio),
            servicioNombre: service?.Nombre || 'Servicio',
            fechaSolicitud: new Date().toISOString(),
            estado: 'Pendiente',
            observaciones: payload.observaciones,
            motivoRechazo: '',
            documentos: (payload.files || []).map(fileToMetadata)
          }

          set((state) => ({
            requests: [request, ...state.requests]
          }))

          return request
        }
      },

      fetchServiceRequests: async () => {
        try {
          const data = await jsonFetch(apiUrl('/solicitudservicio'))
          const normalized = ensureArray(data).map(normalizeRequest)
          set({ requests: normalized })
          return normalized
        } catch {
          return get().requests
        }
      },

      approveServiceRequest: async (requestId) => {
        try {
          const result = await jsonFetch(apiUrl(`/solicitudservicio/aprobar/${requestId}`), {
            method: 'PUT'
          })
          await get().fetchServiceRequests()
          return result
        } catch {
          const request = get().requests.find((item) => item.idSolicitudServicio === requestId)
          if (!request) throw new Error('Solicitud no encontrada.')

          const service = get().servicesCatalog.find((item) => item.idServicio === request.idServicio)
          const existingAssignment = get().serviceAssignments.find(
            (item) =>
              String(item.socioUsuario) === String(request.socioUsuario) &&
              Number(item.idServicio) === Number(request.idServicio)
          )

          set((state) => ({
            requests: state.requests.map((item) =>
              item.idSolicitudServicio === requestId
                ? { ...item, estado: 'Aprobada', motivoRechazo: '' }
                : item
            ),
            serviceAssignments: existingAssignment
              ? state.serviceAssignments
              : [
                  {
                    idServicioSocio: nextId(state.serviceAssignments, 'idServicioSocio'),
                    socioUsuario: request.socioUsuario,
                    socioNombre: request.socioNombre,
                    idServicio: request.idServicio,
                    servicioNombre: request.servicioNombre,
                    tarifa: service?.TarifaBase || 0,
                    estado: 'Activo',
                    idMedidor: null,
                    numeroMedidor: '',
                    tipoMedidor: service?.TipoMedidor || 'General'
                  },
                  ...state.serviceAssignments
                ]
          }))

          return true
        }
      },

      rejectServiceRequest: async (requestId, motivoRechazo) => {
        try {
          const result = await jsonFetch(apiUrl(`/solicitudservicio/rechazar/${requestId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivoRechazo })
          })
          await get().fetchServiceRequests()
          return result
        } catch {
          set((state) => ({
            requests: state.requests.map((item) =>
              item.idSolicitudServicio === requestId
                ? { ...item, estado: 'Rechazada', motivoRechazo }
                : item
            )
          }))
          return true
        }
      },

      fetchSocioServices: async (socioUsuario) => {
        try {
          const data = await jsonFetch(apiUrl('/serviciosocio'))
          const normalized = ensureArray(data).map(normalizeAssignment)
          set({ serviceAssignments: normalized })
          return normalized.filter((item) => String(item.socioUsuario) === String(socioUsuario))
        } catch {
          return get().serviceAssignments.filter(
            (item) => String(item.socioUsuario) === String(socioUsuario)
          )
        }
      },

      fetchAllServiceAssignments: async () => {
        try {
          const data = await jsonFetch(apiUrl('/serviciosocio'))
          const normalized = ensureArray(data).map(normalizeAssignment)
          set({ serviceAssignments: normalized })
          return normalized
        } catch {
          return get().serviceAssignments
        }
      },

      fetchMeters: async () => {
        try {
          const data = await jsonFetch(apiUrl('/medidor'))
          const normalized = ensureArray(data).map(normalizeMeter)
          set({ meters: normalized })
          return normalized
        } catch {
          return get().meters
        }
      },

      createMeter: async (payload) => {
        try {
          const created = await jsonFetch(apiUrl('/medidor'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          await get().fetchMeters()
          return created
        } catch {
          const assignment = get().serviceAssignments.find(
            (item) => item.idServicioSocio === Number(payload.idServicioSocio)
          )
          if (!assignment) throw new Error('ServicioSocio no encontrado.')

          const meter = {
            idMedidor: nextId(get().meters, 'idMedidor'),
            NumeroMedidor: generateMeterNumber(get().meters),
            idServicioSocio: assignment.idServicioSocio,
            socioUsuario: assignment.socioUsuario,
            socioNombre: assignment.socioNombre,
            idServicio: assignment.idServicio,
            servicioNombre: assignment.servicioNombre,
            TipoMedidor: payload.TipoMedidor,
            FechaInstalacion: payload.FechaInstalacion,
            Estado: 'Activo'
          }

          set((state) => ({
            meters: [meter, ...state.meters],
            serviceAssignments: state.serviceAssignments.map((item) =>
              item.idServicioSocio === assignment.idServicioSocio
                ? {
                    ...item,
                    idMedidor: meter.idMedidor,
                    numeroMedidor: meter.NumeroMedidor,
                    tipoMedidor: meter.TipoMedidor
                  }
                : item
            )
          }))

          return meter
        }
      },

      updateMeter: async (meterId, payload) => {
        try {
          const updated = await jsonFetch(apiUrl(`/medidor/${meterId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          await get().fetchMeters()
          return updated
        } catch {
          set((state) => ({
            meters: state.meters.map((item) =>
              item.idMedidor === meterId ? { ...item, ...payload } : item
            )
          }))
          return true
        }
      },

      toggleMeterStatus: async (meterId) => {
        try {
          const updated = await jsonFetch(apiUrl(`/medidor/estado/${meterId}`), {
            method: 'PUT'
          })
          await get().fetchMeters()
          return updated
        } catch {
          set((state) => ({
            meters: state.meters.map((item) =>
              item.idMedidor === meterId
                ? { ...item, Estado: item.Estado === 'Activo' ? 'Inactivo' : 'Activo' }
                : item
            )
          }))
          return true
        }
      },

      fetchMeasurementsBySocio: async (socioUsuario) => {
        try {
          const data = await jsonFetch(apiUrl(`/medicion/socio/${socioUsuario}`))
          const normalized = ensureArray(data).map(normalizeMeasurement)
          set({ measurements: normalized })
          return normalized
        } catch {
          return get().measurements.filter((item) => String(item.socioUsuario) === String(socioUsuario))
        }
      },

      fetchMeasurementsByMeter: async (meterId) => {
        try {
          const data = await jsonFetch(apiUrl(`/medicion/medidor/${meterId}`))
          const normalized = ensureArray(data).map(normalizeMeasurement)
          set({ measurements: normalized })
          return normalized.filter((item) => Number(item.idMedidor) === Number(meterId))
        } catch {
          return get().measurements.filter((item) => Number(item.idMedidor) === Number(meterId))
        }
      },

      createMeasurement: async (payload) => {
        try {
          const created = await jsonFetch(apiUrl('/medicion'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          return created
        } catch {
          const meter = get().meters.find((item) => item.idMedidor === Number(payload.idMedidor))
          if (!meter) throw new Error('Medidor no encontrado.')

          const previousMeasurements = get()
            .measurements
            .filter((item) => item.idMedidor === meter.idMedidor)
            .sort((a, b) => new Date(b.FechaLectura) - new Date(a.FechaLectura))
          const lastReading = previousMeasurements[0]?.LecturaActual || 0
          const currentReading = Number(payload.LecturaActual)

          if (Number.isNaN(currentReading) || currentReading < lastReading) {
            throw new Error('La lectura actual debe ser mayor o igual a la anterior.')
          }

          const measurement = {
            idMedicion: nextId(get().measurements, 'idMedicion'),
            idMedidor: meter.idMedidor,
            NumeroMedidor: meter.NumeroMedidor,
            socioUsuario: meter.socioUsuario,
            socioNombre: meter.socioNombre,
            servicioNombre: meter.servicioNombre,
            FechaLectura: payload.FechaLectura,
            LecturaAnterior: lastReading,
            LecturaActual: currentReading,
            Consumo: currentReading - lastReading,
            TipoLectura: payload.TipoLectura,
            EmpleadoUsuario: payload.EmpleadoUsuario
          }

          set((state) => ({
            measurements: [measurement, ...state.measurements]
          }))

          return measurement
        }
      }
    }),
    {
      name: 'cooperativa-service-workflow'
    }
  )
)

export { SERVICE_REQUEST_STATUSES }
export default useServiceWorkflowStore
