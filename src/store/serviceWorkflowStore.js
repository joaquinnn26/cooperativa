import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiUrl } from '@/config/api.js'

const SERVICE_REQUEST_STATUSES = ['Pendiente', 'En revision', 'Aprobada', 'Cancelada', 'Rechazada']

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

const mockRequests = []

const mockAssignments = []
const mockMeters = []
const mockMeasurements = []
const mockMeasurementTypes = [
  { idTipoLectura: 1, Nombre: 'Lectura normal' },
  { idTipoLectura: 2, Nombre: 'Lectura estimada' },
  { idTipoLectura: 3, Nombre: 'Lectura de control' }
]

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

function resolveServiceName(entity) {
  return pickFirst(
    entity?.servicioNombre,
    entity?.ServicioNombre,
    entity?.Servicio?.Nombre,
    entity?.Servicio?.nombre,
    entity?.servicio?.Nombre,
    entity?.servicio?.nombre,
    entity?.Servicio,
    entity?.servicio,
    entity?.NombreServicio,
    entity?.nombreServicio,
    'Servicio'
  )
}

function resolvePersonName(persona) {
  if (!persona || typeof persona !== 'object') return ''

  const nombre = pickFirst(persona.Nombre, persona.nombre, '').trim()
  const apellido = pickFirst(persona.Apellido, persona.apellido, '').trim()
  return [nombre, apellido].filter(Boolean).join(' ').trim()
}

function resolveSocioName(entity) {
  return pickFirst(
    entity?.socioNombre,
    entity?.SocioNombre,
    entity?.nombreSocio,
    entity?.NombreSocio,
    entity?.Socio,
    entity?.socio,
    resolvePersonName(entity?.Socio?.Persona),
    resolvePersonName(entity?.socio?.persona),
    resolvePersonName(entity?.Persona),
    resolvePersonName(entity?.persona),
    'Socio'
  )
}

function resolveSocioUsuario(entity) {
  return String(
    pickFirst(
      entity?.socioUsuario,
      entity?.SocioUsuario,
      entity?.usuario,
      entity?.Usuario,
      entity?.Documento,
      entity?.Socio?.Persona?.Documento,
      entity?.socio?.persona?.documento,
      ''
    )
  )
}

function resolveAddress(entity) {
  const persona =
    entity?.Persona ||
    entity?.persona ||
    entity?.Socio?.Persona ||
    entity?.socio?.persona ||
    entity?.Socio?.persona ||
    entity?.socio?.Persona ||
    null

  const calle = pickFirst(
    entity?.Direccion,
    entity?.direccion,
    entity?.Domicilio,
    entity?.domicilio,
    persona?.Direccion,
    persona?.direccion,
    persona?.Calle,
    persona?.calle,
    ''
  )
  const numero = pickFirst(entity?.Numero, entity?.numero, persona?.Numero, persona?.numero, '')
  const composed = [String(calle || '').trim(), String(numero || '').trim()].filter(Boolean).join(' ')

  return composed || pickFirst(entity?.observaciones, entity?.Observaciones, 'Sin direccion informada')
}

function resolveEmployeeName(entity) {
  return pickFirst(
    entity?.EmpleadoUsuario,
    entity?.empleadoUsuario,
    entity?.NombreEmpleado,
    entity?.nombreEmpleado,
    entity?.Empleado,
    entity?.empleado,
    resolvePersonName(entity?.Empleado?.Persona),
    resolvePersonName(entity?.empleado?.persona),
    ''
  )
}

function resolveMeterNumber(entity) {
  return pickFirst(
    entity?.NumeroMedidor,
    entity?.numeroMedidor,
    entity?.Medidor,
    entity?.medidor,
    entity?.Numero,
    entity?.numero,
    entity?.Medidor?.NumeroMedidor,
    entity?.medidor?.numeroMedidor,
    ''
  )
}

function resolveMeasurementType(entity) {
  return pickFirst(
    entity?.TipoLectura,
    entity?.tipoLectura,
    entity?.TipoDeLectura,
    entity?.tipoDeLectura,
    entity?.Tipo,
    entity?.tipo,
    'Manual'
  )
}

function nextId(items, key) {
  return items.length ? Math.max(...items.map((item) => Number(item[key]) || 0)) + 1 : 1
}

function isPrimitiveServiceId(value) {
  return typeof value === 'number' || typeof value === 'string'
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
    idSocio: pickFirst(request.idSocio, request.IdSocio, request.idsocio, null),
    socioUsuario: resolveSocioUsuario(request),
    socioNombre: resolveSocioName(request),
    idServicio: Number(pickFirst(request.idServicio, request.IdServicio, request.idservicio)),
    servicioNombre: resolveServiceName(request),
    fechaSolicitud: pickFirst(request.fechaSolicitud, request.FechaSolicitud, request.fecha, new Date().toISOString()),
    estado: pickFirst(request.estado, request.Estado, 'Pendiente'),
    direccion: resolveAddress(request),
    observaciones: pickFirst(request.observaciones, request.Observaciones, ''),
    motivoRechazo: pickFirst(request.motivoRechazo, request.MotivoRechazo, ''),
    documentos: ensureArray(pickFirst(request.documentos, request.Documentos, []))
  }
}

function normalizeAssignment(assignment, servicesCatalog = []) {
  if (isPrimitiveServiceId(assignment)) {
    const idServicio = Number(assignment)
    const service = servicesCatalog.find((item) => Number(item.idServicio) === idServicio)

    return {
      idServicioSocio: null,
      idSocio: null,
      socioUsuario: '',
      socioNombre: 'Socio',
      idServicio,
      servicioNombre: service?.Nombre || 'Servicio',
      tarifa: Number(service?.TarifaBase || 0),
      estado: 'Activo',
      idMedidor: null,
      numeroMedidor: '',
      tipoMedidor: service?.TipoMedidor || ''
    }
  }

  return {
    idServicioSocio: pickFirst(assignment.idServicioSocio, assignment.IdServicioSocio, assignment.id),
    idSocio: pickFirst(
      assignment.idSocio,
      assignment.IdSocio,
      assignment.idsocio,
      assignment.Socio?.idSocio,
      assignment.socio?.idSocio,
      null
    ),
    socioUsuario: resolveSocioUsuario(assignment),
    socioNombre: resolveSocioName(assignment),
    idServicio: Number(
      pickFirst(
        assignment.idServicio,
        assignment.IdServicio,
        assignment.idservicio,
        assignment.Servicio?.idServicio,
        assignment.servicio?.idServicio
      )
    ),
    servicioNombre: resolveServiceName(assignment),
    tarifa: Number(pickFirst(assignment.tarifa, assignment.Tarifa, assignment.tarifaBase, assignment.TarifaBase, 0)),
    estado: pickFirst(assignment.estado, assignment.Estado, assignment.Activo === false ? 'Inactivo' : 'Activo', 'Activo'),
    idMedidor: pickFirst(assignment.idMedidor, assignment.IdMedidor, null),
    numeroMedidor: pickFirst(assignment.numeroMedidor, assignment.NumeroMedidor, assignment.Numero, ''),
    tipoMedidor: pickFirst(assignment.tipoMedidor, assignment.TipoMedidor, '')
  }
}

function normalizeMeter(meter) {
  return {
    idMedidor: pickFirst(meter.idMedidor, meter.IdMedidor, meter.id, meter.MedidorId),
    NumeroMedidor: resolveMeterNumber(meter),
    idServicioSocio: pickFirst(
      meter.idServicioSocio,
      meter.IdServicioSocio,
      meter.ServicioSocio?.idServicioSocio,
      meter.servicioSocio?.idServicioSocio,
      null
    ),
    idSocio: pickFirst(
      meter.idSocio,
      meter.IdSocio,
      meter.idsocio,
      meter.ServicioSocio?.idSocio,
      meter.servicioSocio?.idSocio,
      meter.ServicioSocio?.Socio?.idSocio,
      null
    ),
    socioUsuario: resolveSocioUsuario(meter),
    socioNombre: resolveSocioName(meter),
    idServicio: Number(
      pickFirst(
        meter.idServicio,
        meter.IdServicio,
        meter.idservicio,
        meter.ServicioSocio?.idServicio,
        meter.servicioSocio?.idServicio,
        0
      )
    ),
    servicioNombre: resolveServiceName(meter),
    TipoMedidor: pickFirst(meter.TipoMedidor, meter.tipoMedidor, meter.Tipo, 'General'),
    FechaInstalacion: pickFirst(meter.FechaInstalacion, meter.fechaInstalacion, new Date().toISOString()),
    Estado: pickFirst(meter.Estado, meter.estado, meter.Activo === false ? 'Inactivo' : 'Activo', 'Activo')
  }
}

function normalizeMeasurement(measurement) {
  return {
    idMedicion: pickFirst(measurement.idMedicion, measurement.IdMedicion, measurement.id),
    idMedidor: pickFirst(
      measurement.idMedidor,
      measurement.IdMedidor,
      measurement.Medidor?.idMedidor,
      measurement.medidor?.idMedidor
    ),
    idSocio: pickFirst(
      measurement.idSocio,
      measurement.IdSocio,
      measurement.idsocio,
      measurement.Medidor?.ServicioSocio?.idSocio,
      measurement.medidor?.servicioSocio?.idSocio,
      null
    ),
    NumeroMedidor: resolveMeterNumber(measurement),
    socioUsuario: resolveSocioUsuario(measurement),
    socioNombre: resolveSocioName(measurement),
    servicioNombre: resolveServiceName(measurement),
    FechaLectura: pickFirst(measurement.FechaLectura, measurement.fechaLectura, new Date().toISOString()),
    FechaCarga: pickFirst(measurement.FechaCarga, measurement.fechaCarga, null),
    LecturaAnterior: Number(pickFirst(measurement.LecturaAnterior, measurement.lecturaAnterior, 0)),
    LecturaActual: Number(pickFirst(measurement.LecturaActual, measurement.lecturaActual, measurement.ValorLectura, 0)),
    Consumo: Number(pickFirst(measurement.Consumo, measurement.consumo, measurement.ConsumoCalculado, 0)),
    TipoLectura: resolveMeasurementType(measurement),
    idEmpleado: pickFirst(
      measurement.idEmpleado,
      measurement.IdEmpleado,
      measurement.Empleado?.idEmpleado,
      measurement.empleado?.idEmpleado,
      null
    ),
    EmpleadoUsuario: resolveEmployeeName(measurement)
  }
}

function compareMeasurements(a, b) {
  const fechaLecturaA = new Date(a.FechaLectura).getTime() || 0
  const fechaLecturaB = new Date(b.FechaLectura).getTime() || 0
  if (fechaLecturaA !== fechaLecturaB) return fechaLecturaA - fechaLecturaB

  const fechaCargaA = new Date(a.FechaCarga || 0).getTime() || 0
  const fechaCargaB = new Date(b.FechaCarga || 0).getTime() || 0
  if (fechaCargaA !== fechaCargaB) return fechaCargaA - fechaCargaB

  return Number(a.idMedicion || 0) - Number(b.idMedicion || 0)
}

function normalizeMeasurementType(type) {
  return {
    idTipoLectura: Number(
      pickFirst(type.idTipoLectura, type.IdTipoLectura, type.id, type.IDTipoLectura, 0)
    ),
    Nombre: pickFirst(type.Nombre, type.nombre, type.TipoLectura, type.tipoLectura, `Tipo ${type.idTipoLectura ?? type.id ?? ''}`)
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

async function uploadRequestDocument({ file, idSolicitudServicio, idRequisitoServicio }) {
  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('idSolicitudServicio', String(idSolicitudServicio))
  formData.append('idRequisitoServicio', String(idRequisitoServicio))

  return formDataFetch(apiUrl('/documentosolicitud/upload'), formData)
}

function withPreviousReadings(measurements) {
  const grouped = new Map()

  measurements.forEach((measurement) => {
    const key = String(pickFirst(measurement.idMedidor, measurement.NumeroMedidor, ''))
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(measurement)
  })

  const result = []

  grouped.forEach((items) => {
    const sorted = [...items].sort(compareMeasurements)

    sorted.forEach((item, index) => {
      const previous = index > 0 ? Number(sorted[index - 1].LecturaActual || 0) : 0
      result.push({
        ...item,
        LecturaAnterior: Number(item.LecturaAnterior || previous)
      })
    })
  })

  return result.sort((a, b) => compareMeasurements(b, a))
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
      measurementTypes: mockMeasurementTypes,

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
          const created = await jsonFetch(apiUrl('/solicitudservicio'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idSocio: Number(payload.idSocio),
              idServicio: Number(payload.idServicio),
              observaciones: payload.observaciones
            })
          })

          const requestId = pickFirst(created?.idSolicitudServicio, created?.IdSolicitudServicio, created?.id)
          const uploads = Object.entries(payload.filesByRequirement || {})
            .filter(([, file]) => file instanceof File)
            .map(([idRequisitoServicio, file]) =>
              uploadRequestDocument({
                file,
                idSolicitudServicio: requestId,
                idRequisitoServicio
              })
            )

          if (requestId && uploads.length) {
            await Promise.all(uploads)
          }

          await get().fetchServiceRequests()
          return created
        } catch {
          const service = get().servicesCatalog.find((item) => item.idServicio === Number(payload.idServicio))
          const documents = Object.entries(payload.filesByRequirement || {}).map(([idRequisitoServicio, file], index) => ({
            ...fileToMetadata(file, index),
            idRequisitoServicio: Number(idRequisitoServicio)
          }))
          const request = {
            idSolicitudServicio: nextId(get().requests, 'idSolicitudServicio'),
            idSocio: Number(payload.idSocio),
            socioUsuario: String(payload.socioUsuario || ''),
            socioNombre: payload.socioNombre || payload.socioUsuario || 'Socio',
            idServicio: Number(payload.idServicio),
            servicioNombre: service?.Nombre || 'Servicio',
            fechaSolicitud: new Date().toISOString(),
            estado: 'Pendiente',
            direccion: payload.direccion || payload.observaciones || 'Sin direccion informada',
            observaciones: payload.observaciones,
            motivoRechazo: '',
            documentos: documents
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
          const normalized = await Promise.all(ensureArray(data).map(async (request) => {
            const normalizedRequest = normalizeRequest(request)
            const embeddedDocuments = ensureArray(pickFirst(request.Documentos, request.documentos, []))

            if (embeddedDocuments.length) {
              return {
                ...normalizedRequest,
                documentos: embeddedDocuments.map((document, index) => ({
                  id: pickFirst(document.idDocumentoSolicitud, document.IdDocumentoSolicitud, index),
                  nombre: pickFirst(document.NombreArchivo, document.nombreArchivo, 'Documento'),
                  ruta: pickFirst(document.RutaArchivo, document.rutaArchivo, ''),
                  tipo: pickFirst(document.TipoArchivo, document.tipoArchivo, ''),
                  fechaSubida: pickFirst(document.FechaSubida, document.fechaSubida, ''),
                  idRequisitoServicio: pickFirst(document.idRequisitoServicio, document.IdRequisitoServicio, null)
                }))
              }
            }

            try {
              const documents = await jsonFetch(apiUrl(`/documentosolicitud/solicitud/${normalizedRequest.idSolicitudServicio}`))
              return {
                ...normalizedRequest,
                documentos: ensureArray(documents).map((document, index) => ({
                  id: pickFirst(document.idDocumentoSolicitud, document.IdDocumentoSolicitud, index),
                  nombre: pickFirst(document.NombreArchivo, document.nombreArchivo, 'Documento'),
                  ruta: pickFirst(document.RutaArchivo, document.rutaArchivo, ''),
                  tipo: pickFirst(document.TipoArchivo, document.tipoArchivo, ''),
                  fechaSubida: pickFirst(document.FechaSubida, document.fechaSubida, ''),
                  idRequisitoServicio: pickFirst(document.idRequisitoServicio, document.IdRequisitoServicio, null)
                }))
              }
            } catch {
              return normalizedRequest
            }
          }))
          set({ requests: normalized })
          return normalized
        } catch {
          return get().requests
        }
      },

      fetchServiceRequestsBySocio: async (idSocio) => {
        try {
          const data = await jsonFetch(apiUrl(`/solicitudservicio/socio/${idSocio}`))
          const normalized = ensureArray(data).map((request) => ({
            ...normalizeRequest(request),
            documentos: ensureArray(pickFirst(request.Documentos, request.documentos, [])).map((document, index) => ({
              id: pickFirst(document.idDocumentoSolicitud, document.IdDocumentoSolicitud, index),
              nombre: pickFirst(document.NombreArchivo, document.nombreArchivo, 'Documento'),
              ruta: pickFirst(document.RutaArchivo, document.rutaArchivo, ''),
              tipo: pickFirst(document.TipoArchivo, document.tipoArchivo, ''),
              fechaSubida: pickFirst(document.FechaSubida, document.fechaSubida, ''),
              idRequisitoServicio: pickFirst(document.idRequisitoServicio, document.IdRequisitoServicio, null)
            }))
          }))
          set((state) => ({
            requests: [
              ...state.requests.filter((item) => String(item.idSocio) !== String(idSocio)),
              ...normalized
            ]
          }))
          return normalized
        } catch {
          return get().requests.filter((item) => String(item.idSocio) === String(idSocio))
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
            body: JSON.stringify({ motivo: motivoRechazo })
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

      updateServiceRequestStatus: async (requestId, payload) => {
        const nextStatus = pickFirst(payload?.estado, payload?.Estado)

        if (!SERVICE_REQUEST_STATUSES.includes(nextStatus)) {
          throw new Error('Estado de solicitud no valido.')
        }

        if (nextStatus === 'Aprobada') {
          return get().approveServiceRequest(requestId)
        }

        if (nextStatus === 'Rechazada') {
          return get().rejectServiceRequest(requestId, payload?.motivoRechazo || payload?.motivo || '')
        }

        const body = {
          estado: nextStatus,
          motivoRechazo: payload?.motivoRechazo || '',
          observaciones: payload?.observaciones ?? ''
        }

        const candidatePaths = [
          `/solicitudservicio/estado/${requestId}`,
          `/solicitudservicio/${requestId}/estado`,
          `/solicitudservicio/${requestId}`
        ]

        for (const path of candidatePaths) {
          try {
            const result = await jsonFetch(apiUrl(path), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })
            await get().fetchServiceRequests()
            return result
          } catch {}
        }

        set((state) => ({
          requests: state.requests.map((item) =>
            item.idSolicitudServicio === requestId
              ? {
                  ...item,
                  estado: nextStatus,
                  observaciones: body.observaciones || item.observaciones,
                  motivoRechazo: nextStatus === 'Rechazada' ? body.motivoRechazo : item.motivoRechazo
                }
              : item
          )
        }))

        return true
      },

      fetchSocioServices: async (socioRef) => {
        try {
          const data = await jsonFetch(apiUrl(`/serviciosocio/${socioRef}`))
          let servicesCatalog = get().servicesCatalog

          if (!servicesCatalog.length) {
            servicesCatalog = await get().fetchServicesCatalog()
          }

          const normalized = ensureArray(data).map((assignment) => normalizeAssignment(assignment, servicesCatalog))
          set((state) => ({
            serviceAssignments: [
              ...state.serviceAssignments.filter(
                (item) => String(item.socioUsuario) !== String(socioRef) && String(item.idSocio) !== String(socioRef)
              ),
              ...normalized
            ]
          }))
          return normalized
        } catch {
          return get().serviceAssignments.filter(
            (item) => String(item.socioUsuario) === String(socioRef) || String(item.idSocio) === String(socioRef)
          )
        }
      },

      fetchAllServiceAssignments: async () => {
        try {
          const data = await jsonFetch(apiUrl('/serviciosocio'))
          let servicesCatalog = get().servicesCatalog

          if (!servicesCatalog.length) {
            servicesCatalog = await get().fetchServicesCatalog()
          }

          const normalized = ensureArray(data).map((assignment) => normalizeAssignment(assignment, servicesCatalog))
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
            body: JSON.stringify({
              idServicioSocio: Number(payload.idServicioSocio),
              idTipoMedidor: Number(payload.idTipoMedidor)
            })
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
            TipoMedidor: `Tipo ${payload.idTipoMedidor}`,
            FechaInstalacion: new Date().toISOString(),
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

      fetchMeasurementsBySocio: async (socioRef) => {
        try {
          const data = await jsonFetch(apiUrl('/medicion'))
          const normalized = withPreviousReadings(
            ensureArray(data)
              .map(normalizeMeasurement)
              .filter((item) => String(item.idSocio) === String(socioRef))
          )
          set({ measurements: normalized })
          return normalized
        } catch {
          try {
            const data = await jsonFetch(apiUrl(`/medicion/socio/${socioRef}`))
            const normalized = withPreviousReadings(ensureArray(data).map(normalizeMeasurement))
            set({ measurements: normalized })
            return normalized
          } catch {
            return get().measurements.filter(
              (item) => String(item.socioUsuario) === String(socioRef) || String(item.idSocio) === String(socioRef)
            )
          }
        }
      },

      fetchMeasurementTypes: async () => {
        try {
          const data = await jsonFetch(apiUrl('/tipolectura'))
          const normalized = ensureArray(data)
            .map(normalizeMeasurementType)
            .filter((item) => item.idTipoLectura > 0)
          set({ measurementTypes: normalized })
          return normalized
        } catch {
          return get().measurementTypes
        }
      },

      fetchMeasurementsByMeter: async (meterId) => {
        try {
          const data = await jsonFetch(apiUrl('/medicion'))
          const filtered = withPreviousReadings(
            ensureArray(data)
              .map(normalizeMeasurement)
              .filter((item) => Number(item.idMedidor) === Number(meterId))
          )
          set({ measurements: filtered })
          return filtered
        } catch {
          try {
            const data = await jsonFetch(apiUrl(`/medicion/medidor/${meterId}`))
            const filtered = withPreviousReadings(ensureArray(data).map(normalizeMeasurement))
            set({ measurements: filtered })
            return filtered
          } catch {
            const targetMeter = get().meters.find((item) => Number(item.idMedidor) === Number(meterId))
            return get().measurements.filter((item) =>
              targetMeter ? String(item.NumeroMedidor) === String(targetMeter.NumeroMedidor) : Number(item.idMedidor) === Number(meterId)
            )
          }
        }
      },

      createMeasurement: async (payload) => {
        try {
          const created = await jsonFetch(apiUrl('/medicion'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idMedidor: Number(payload.idMedidor),
              idEmpleado: Number(payload.idEmpleado),
              ValorLectura: Number(payload.LecturaActual),
              FechaLectura: payload.FechaLectura,
              idTipoLectura: Number(payload.idTipoLectura)
            })
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
            idSocio: meter.idSocio ?? null,
            NumeroMedidor: meter.NumeroMedidor,
            socioUsuario: meter.socioUsuario,
            socioNombre: meter.socioNombre,
            servicioNombre: meter.servicioNombre,
            FechaLectura: payload.FechaLectura,
            LecturaAnterior: lastReading,
            LecturaActual: currentReading,
            Consumo: currentReading - lastReading,
            TipoLectura: payload.tipoLecturaNombre || `Tipo ${payload.idTipoLectura}`,
            idEmpleado: Number(payload.idEmpleado),
            EmpleadoUsuario: payload.empleadoNombre || payload.empleadoUsuario || ''
          }

          set((state) => ({
            measurements: [measurement, ...state.measurements]
          }))

          return measurement
        }
      }
    }),
    {
      name: 'cooperativa-service-workflow',
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState

        if (version < 2) {
          return {
            ...persistedState,
            requests: []
          }
        }

        return persistedState
      }
    }
  )
)

export { SERVICE_REQUEST_STATUSES }
export default useServiceWorkflowStore
