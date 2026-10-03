import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiUrl } from '@/config/api.js'
import { serviceRequiresInstallation } from '@/utils/serviceInstallation.js'

const SERVICE_REQUEST_STATUSES = ['En revision', 'Pendiente instalacion', 'Aprobada', 'Cancelada', 'Rechazada']
const CLOSED_SERVICE_REQUEST_STATUS_KEYS = new Set(['rechazada', 'rechazado', 'cancelada', 'cancelado'])
const INACTIVE_SERVICE_ASSIGNMENT_STATUS_KEYS = new Set(['inactivo', 'inactiva', 'baja', 'cancelada', 'cancelado'])
const DUPLICATE_SERVICE_REQUEST_MESSAGE = 'Ya tenés una solicitud pendiente para este servicio.'

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
  },
  {
    idServicio: 3,
    Nombre: 'Internet',
    Descripcion: 'Servicio de internet domiciliario',
    TarifaBase: 12000,
    Activo: true,
    TipoMedidor: 'Sin medidor'
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
  },
  {
    idRequisitoServicio: 5,
    idServicio: 3,
    Nombre: 'DNI del titular',
    Descripcion: 'Frente y dorso del documento vigente.',
    Activo: true
  },
  {
    idRequisitoServicio: 6,
    idServicio: 3,
    Nombre: 'Direccion de instalacion',
    Descripcion: 'Indicar domicilio y referencias para la instalacion tecnica.',
    Activo: true
  }
]

const mockRequests = []

const mockAssignments = []
const mockMeters = []
const mockMeasurements = []
const mockMeasurementRoutes = []
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
    ...options,
    headers: getAuthHeaders(options.headers || {})
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(parseErrorMessage(errorText) || `HTTP ${res.status}`)
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
    throw new Error(parseErrorMessage(errorText) || `HTTP ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function pickFirstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

function parseErrorMessage(errorText) {
  if (!errorText) return ''

  try {
    const parsed = JSON.parse(errorText)
    return parsed.Message || parsed.message || parsed.error || errorText
  } catch {
    return errorText
  }
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeActiveStatus(value) {
  const clean = stripHtml(value).toLowerCase()
  if (['true', '1', 'activo', 'activa', 'activado', 'si', 'sí'].includes(clean)) return 'Activo'
  if (['false', '0', 'inactivo', 'inactiva', 'desactivado', 'no'].includes(clean)) return 'Inactivo'
  return stripHtml(value) || 'Activo'
}

function primitiveValue(value) {
  return value && typeof value === 'object' ? undefined : value
}

function normalizeWorkflowStatus(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeServiceRequestStatusLabel(value) {
  const normalized = normalizeWorkflowStatus(value)
  if (normalized === 'en revision') return 'En revision'
  if (normalized === 'pendiente instalacion') return 'Pendiente instalacion'
  if (normalized === 'instalada') return 'Aprobada'
  if (normalized === 'aprobada') return 'Aprobada'
  if (normalized === 'rechazada' || normalized === 'rechazado') return 'Rechazada'
  if (normalized === 'cancelada' || normalized === 'cancelado') return 'Cancelada'
  if (normalized === 'pendiente') return 'Pendiente'
  return stripHtml(value) || 'Pendiente'
}

function entityMatchesSocio(entity, socioRef, socioUsuario = '') {
  const entitySocioId = pickFirst(entity?.idSocio, entity?.IdSocio, entity?.idsocio, null)
  if (socioRef != null && entitySocioId != null && String(entitySocioId) === String(socioRef)) {
    return true
  }

  const targetUsuario = String(socioUsuario || '').trim().toLowerCase()
  const entityUsuario = String(
    pickFirst(entity?.socioUsuario, entity?.SocioUsuario, entity?.usuario, entity?.Usuario, '')
  )
    .trim()
    .toLowerCase()

  return Boolean(targetUsuario && entityUsuario && entityUsuario === targetUsuario)
}

function entityMatchesService(entity, serviceId) {
  const targetServiceId = Number(serviceId)
  const entityServiceId = Number(pickFirst(entity?.idServicio, entity?.IdServicio, entity?.idservicio, 0))
  return Number.isFinite(targetServiceId) && targetServiceId > 0 && entityServiceId === targetServiceId
}

function isBlockingServiceAssignment(assignment) {
  const status = normalizeWorkflowStatus(
    pickFirst(assignment?.estado, assignment?.Estado, assignment?.Activo === false ? 'Inactivo' : 'Activo')
  )
  return !INACTIVE_SERVICE_ASSIGNMENT_STATUS_KEYS.has(status)
}

function isBlockingServiceRequest(request) {
  const status = normalizeWorkflowStatus(pickFirst(request?.estado, request?.Estado, 'Pendiente'))
  return !CLOSED_SERVICE_REQUEST_STATUS_KEYS.has(status)
}

function findBlockingServiceRequest(payload, state) {
  const socioRef = pickFirst(payload?.idSocio, null)
  const socioUsuario = payload?.socioUsuario || ''
  const serviceId = payload?.idServicio

  return state.requests.find(
    (item) =>
      entityMatchesSocio(item, socioRef, socioUsuario) &&
      entityMatchesService(item, serviceId) &&
      isBlockingServiceRequest(item)
  )
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
  return pickFirstFilled(
    entity?.servicioNombre,
    entity?.ServicioNombre,
    entity?.Servicio?.Nombre,
    entity?.Servicio?.nombre,
    entity?.Servicio?.Descripcion,
    entity?.Servicio?.descripcion,
    entity?.servicio?.Nombre,
    entity?.servicio?.nombre,
    entity?.servicio?.Descripcion,
    entity?.servicio?.descripcion,
    entity?.ServicioSocio?.Servicio?.Nombre,
    entity?.ServicioSocio?.Servicio?.nombre,
    entity?.ServicioSocio?.servicio?.Nombre,
    entity?.ServicioSocio?.servicio?.nombre,
    entity?.servicioSocio?.Servicio?.Nombre,
    entity?.servicioSocio?.Servicio?.nombre,
    entity?.servicioSocio?.servicio?.Nombre,
    entity?.servicioSocio?.servicio?.nombre,
    primitiveValue(entity?.Servicio),
    primitiveValue(entity?.servicio),
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
  return pickFirstFilled(
    entity?.NumeroMedidor,
    entity?.numeroMedidor,
    entity?.NroMedidor,
    entity?.nroMedidor,
    entity?.CodigoMedidor,
    entity?.codigoMedidor,
    entity?.Medidor?.NumeroMedidor,
    entity?.Medidor?.numeroMedidor,
    entity?.Medidor?.NroMedidor,
    entity?.Medidor?.nroMedidor,
    entity?.Medidor?.CodigoMedidor,
    entity?.Medidor?.codigoMedidor,
    entity?.medidor?.numeroMedidor,
    entity?.medidor?.NumeroMedidor,
    entity?.medidor?.nroMedidor,
    entity?.medidor?.NroMedidor,
    entity?.medidor?.codigoMedidor,
    entity?.medidor?.CodigoMedidor,
    entity?.Numero,
    entity?.numero,
    primitiveValue(entity?.Medidor),
    primitiveValue(entity?.medidor),
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
    estado: normalizeServiceRequestStatusLabel(pickFirst(request.estado, request.Estado, 'Pendiente')),
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
      assignment.Socio?.IdSocio,
      assignment.socio?.idSocio,
      assignment.socio?.IdSocio,
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
        assignment.Servicio?.IdServicio,
        assignment.servicio?.idServicio,
        assignment.servicio?.IdServicio
      )
    ),
    servicioNombre: resolveServiceName(assignment),
    tarifa: Number(pickFirst(assignment.tarifa, assignment.Tarifa, assignment.tarifaBase, assignment.TarifaBase, 0)),
    estado: pickFirst(assignment.estado, assignment.Estado, assignment.Activo === false ? 'Inactivo' : 'Activo', 'Activo'),
    idMedidor: pickFirst(
      assignment.idMedidor,
      assignment.IdMedidor,
      assignment.Medidor?.idMedidor,
      assignment.Medidor?.IdMedidor,
      assignment.medidor?.idMedidor,
      assignment.medidor?.IdMedidor,
      null
    ),
    numeroMedidor: resolveMeterNumber(assignment),
    tipoMedidor: pickFirst(
      assignment.tipoMedidor,
      assignment.TipoMedidor,
      assignment.Medidor?.TipoMedidor,
      assignment.Medidor?.tipoMedidor,
      assignment.medidor?.TipoMedidor,
      assignment.medidor?.tipoMedidor,
      ''
    )
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
      meter.ServicioSocio?.IdServicioSocio,
      meter.servicioSocio?.idServicioSocio,
      meter.servicioSocio?.IdServicioSocio,
      null
    ),
    idSocio: pickFirst(
      meter.idSocio,
      meter.IdSocio,
      meter.idsocio,
      meter.ServicioSocio?.idSocio,
      meter.ServicioSocio?.IdSocio,
      meter.servicioSocio?.idSocio,
      meter.servicioSocio?.IdSocio,
      meter.ServicioSocio?.Socio?.idSocio,
      meter.ServicioSocio?.Socio?.IdSocio,
      meter.servicioSocio?.socio?.idSocio,
      meter.servicioSocio?.socio?.IdSocio,
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
        meter.ServicioSocio?.IdServicio,
        meter.servicioSocio?.idServicio,
        meter.servicioSocio?.IdServicio,
        meter.ServicioSocio?.Servicio?.idServicio,
        meter.ServicioSocio?.Servicio?.IdServicio,
        meter.servicioSocio?.servicio?.idServicio,
        meter.servicioSocio?.servicio?.IdServicio,
        0
      )
    ),
    servicioNombre: resolveServiceName(meter),
    TipoMedidor: pickFirst(meter.TipoMedidor, meter.tipoMedidor, meter.Tipo, 'General'),
    FechaInstalacion: pickFirst(meter.FechaInstalacion, meter.fechaInstalacion, new Date().toISOString()),
    Estado: normalizeActiveStatus(meter.Activo === false ? 'Inactivo' : pickFirst(meter.Estado, meter.estado, meter.Activo, 'Activo'))
  }
}

function normalizeRequirementKey(requirement) {
  const serviceId = pickFirst(requirement?.idServicio, requirement?.IdServicio, '')
  const name = normalizeWorkflowStatus(pickFirst(requirement?.Nombre, requirement?.nombre, requirement?.Requisito, requirement?.requisito, ''))
  if (serviceId !== '' && name !== '') return `service:${serviceId}:name:${name}`

  const id = pickFirst(requirement?.idRequisitoServicio, requirement?.IdRequisitoServicio)
  return `id:${id}`
}

function dedupeRequirements(requirements) {
  const map = new Map()

  requirements.forEach((requirement) => {
    const normalized = normalizeRequirement(requirement)
    const key = normalizeRequirementKey(normalized)
    const current = map.get(key)
    map.set(key, { ...current, ...normalized })
  })

  return Array.from(map.values())
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

function normalizeMeasurementRoute(route) {
  const items = ensureArray(route?.items || route?.medidores || route?.Meters).map((item, index) => ({
    ...item,
    idMedidor: Number(pickFirst(item.idMedidor, item.IdMedidor, item.id, item.Medidor?.idMedidor, 0)),
    orden: Number(pickFirst(item.orden, item.Orden, index + 1)),
    estado: pickFirst(item.estado, item.Estado, 'Pendiente'),
    lecturaActual: pickFirst(item.lecturaActual, item.LecturaActual, ''),
    idMedicion: pickFirst(item.idMedicion, item.IdMedicion, null),
    fechaMedicion: pickFirst(item.fechaMedicion, item.FechaMedicion, null),
    observacion: pickFirst(item.observacion, item.Observacion, '')
  }))

  return {
    idRutaMedicion: pickFirst(route?.idRutaMedicion, route?.IdRutaMedicion, route?.id, route?.Id),
    nombre: pickFirst(route?.nombre, route?.Nombre, 'Hoja de ruta'),
    fecha: pickFirst(route?.fecha, route?.Fecha, new Date().toISOString().slice(0, 10)),
    idEmpleado: Number(pickFirst(route?.idEmpleado, route?.IdEmpleado, 0)),
    empleadoNombre: pickFirst(route?.empleadoNombre, route?.EmpleadoNombre, ''),
    estado: pickFirst(route?.estado, route?.Estado, 'Pendiente'),
    creadaEn: pickFirst(route?.creadaEn, route?.CreadaEn, new Date().toISOString()),
    fechaCaducidadUtc: pickFirst(route?.fechaCaducidadUtc, route?.FechaCaducidadUtc, null),
    iniciadaEn: pickFirst(route?.iniciadaEn, route?.IniciadaEn, null),
    finalizadaEn: pickFirst(route?.finalizadaEn, route?.FinalizadaEn, null),
    firmaDigital: pickFirst(route?.firmaDigital, route?.FirmaDigital, ''),
    items: items.sort((a, b) => a.orden - b.orden)
  }
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
      measurementRoutes: mockMeasurementRoutes,
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
          const normalized = dedupeRequirements(ensureArray(data)).filter((item) => item.Activo)
          set((state) => ({
            requirementsCatalog: dedupeRequirements([
              ...state.requirementsCatalog.filter((item) => item.idServicio !== Number(serviceId)),
              ...normalized
            ])
          }))
          return normalized
        } catch {
          return dedupeRequirements(get().requirementsCatalog).filter(
            (item) => item.idServicio === Number(serviceId) && item.Activo
          )
        }
      },

      fetchAllRequirements: async () => {
        try {
          const data = await jsonFetch(apiUrl('/requisitoservicio'))
          const normalized = dedupeRequirements(ensureArray(data))
          set({ requirementsCatalog: normalized })
          return normalized
        } catch {
          const normalized = dedupeRequirements(get().requirementsCatalog)
          set({ requirementsCatalog: normalized })
          return normalized
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
            requirementsCatalog: dedupeRequirements([requirement, ...state.requirementsCatalog])
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
        if (payload.idSocio) {
          await Promise.allSettled([
            get().fetchSocioServices(payload.idSocio),
            get().fetchServiceRequestsBySocio(payload.idSocio)
          ])
        }

        if (findBlockingServiceRequest(payload, get())) {
          throw new Error(DUPLICATE_SERVICE_REQUEST_MESSAGE)
        }

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
        } catch (error) {
          throw new Error(error.message || 'No se pudo registrar la solicitud en la API. No se guardaron datos locales.')
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
          const numericSocioId = Number(idSocio)
          const normalized = ensureArray(data).map((request) => {
            const normalizedRequest = normalizeRequest(request)

            return {
              ...normalizedRequest,
              idSocio: pickFirst(
                normalizedRequest.idSocio,
                Number.isFinite(numericSocioId) && numericSocioId > 0 ? numericSocioId : null
              ),
              socioUsuario: normalizedRequest.socioUsuario || (!Number.isFinite(numericSocioId) ? String(idSocio) : ''),
              documentos: ensureArray(pickFirst(request.Documentos, request.documentos, [])).map((document, index) => ({
                id: pickFirst(document.idDocumentoSolicitud, document.IdDocumentoSolicitud, index),
                nombre: pickFirst(document.NombreArchivo, document.nombreArchivo, 'Documento'),
                ruta: pickFirst(document.RutaArchivo, document.rutaArchivo, ''),
                tipo: pickFirst(document.TipoArchivo, document.tipoArchivo, ''),
                fechaSubida: pickFirst(document.FechaSubida, document.fechaSubida, ''),
                idRequisitoServicio: pickFirst(document.idRequisitoServicio, document.IdRequisitoServicio, null)
              }))
            }
          })
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
                ? {
                    ...item,
                    estado: serviceRequiresInstallation(item.servicioNombre) ? 'Pendiente instalacion' : 'Aprobada',
                    motivoRechazo: ''
                  }
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

      rejectServiceRequest: async (requestId, idMotivoEvento) => {
        const result = await jsonFetch(apiUrl(`/solicitudservicio/rechazar/${requestId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idMotivoEvento: Number(idMotivoEvento) })
        })
        await get().fetchServiceRequests()
        return result
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
          return get().rejectServiceRequest(requestId, payload?.idMotivoEvento)
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

      markServiceRequestInstalled: async (requestId, payload = {}) => {
        try {
          const result = await jsonFetch(apiUrl(`/solicitudservicio/instalar/${requestId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              observaciones: payload.observaciones || ''
            })
          })
          await get().fetchServiceRequests()
          return result
        } catch (error) {
          throw new Error(error.message || 'No se pudo marcar la solicitud como instalada.')
        }
      },

      rejectServiceInstallation: async (requestId, idMotivoEvento) => {
        try {
          const result = await jsonFetch(apiUrl(`/solicitudservicio/rechazar-instalacion/${requestId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idMotivoEvento: Number(idMotivoEvento) })
          })
          await get().fetchServiceRequests()
          return result
        } catch (error) {
          throw new Error(error.message || 'No se pudo rechazar la instalacion.')
        }
      },

      fetchSocioServices: async (socioRef) => {
        try {
          const data = await jsonFetch(apiUrl(`/serviciosocio/${socioRef}`))
          let servicesCatalog = get().servicesCatalog

          if (!servicesCatalog.length) {
            servicesCatalog = await get().fetchServicesCatalog()
          }

          const numericSocioId = Number(socioRef)
          const normalized = ensureArray(data).map((assignment) => {
            const normalizedAssignment = normalizeAssignment(assignment, servicesCatalog)

            return {
              ...normalizedAssignment,
              idSocio: pickFirst(
                normalizedAssignment.idSocio,
                Number.isFinite(numericSocioId) && numericSocioId > 0 ? numericSocioId : null
              ),
              socioUsuario: normalizedAssignment.socioUsuario || (!Number.isFinite(numericSocioId) ? String(socioRef) : '')
            }
          })
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

      fetchMeters: async ({ throwOnError = false } = {}) => {
        try {
          const data = await jsonFetch(apiUrl('/medidor'))
          const normalized = ensureArray(data).map(normalizeMeter)
          const currentMeters = get().meters
          const merged = [
            ...normalized,
            ...currentMeters.filter(
              (existing) =>
                existing.Estado === 'Inactivo' &&
                !normalized.some((incoming) => Number(incoming.idMedidor) === Number(existing.idMedidor))
            )
          ]
          set({ meters: merged })
          return merged
        } catch (error) {
          if (throwOnError) throw error
          return get().meters
        }
      },

      fetchMetersBySocio: async (socioRef) => {
        if (!socioRef) throw new Error('No se pudo identificar el socio.')

        const data = await jsonFetch(apiUrl(`/medidor/socio/${socioRef}`))
        const normalized = ensureArray(data).map(normalizeMeter)
        set((state) => ({
          meters: [
            ...state.meters.filter(
              (meter) =>
                String(meter.idSocio) !== String(socioRef) &&
                String(meter.socioUsuario) !== String(socioRef)
            ),
            ...normalized
          ]
        }))
        return normalized
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
        } catch (error) {
          throw new Error(error.message || 'No se pudo registrar el medidor en el servidor.')
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

      deleteMeter: async (meterId) => {
        try {
          const deleted = await jsonFetch(apiUrl(`/medidor/${meterId}`), {
            method: 'DELETE'
          })
          await get().fetchMeters()
          return deleted
        } catch {
          set((state) => ({
            meters: state.meters.filter((item) => item.idMedidor !== meterId)
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
        } catch (error) { throw error }
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
        } catch (error) {
          throw error
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
      },

      fetchMeasurementRoutes: async ({ throwOnError = false } = {}) => {
        try {
          const data = await jsonFetch(apiUrl('/rutas-medicion'))
          const normalized = ensureArray(data).map(normalizeMeasurementRoute)
          set({ measurementRoutes: normalized })
          return normalized
        } catch (error) {
          if (throwOnError) throw error
          return get().measurementRoutes.map(normalizeMeasurementRoute)
        }
      },

      fetchMeasurementRoutesByEmployee: async (employeeId) => {
        try {
          const data = await jsonFetch(apiUrl(`/rutas-medicion/empleado/${employeeId}`))
          const normalized = ensureArray(data).map(normalizeMeasurementRoute)
          set((state) => ({
            measurementRoutes: [
              ...state.measurementRoutes.filter((route) => String(route.idEmpleado) !== String(employeeId)),
              ...normalized
            ]
          }))
          return normalized
        } catch (error) { throw error }
      },

      createMeasurementRoute: async (payload) => {
        const selectedMeters = ensureArray(payload?.meters)
          .map((meter, index) => ({
            idMedidor: Number(pickFirst(meter.idMedidor, meter.IdMedidor, meter.id, meter)),
            orden: index + 1,
            estado: 'Pendiente',
            lecturaActual: '',
            idMedicion: null,
            fechaMedicion: null,
            observacion: ''
          }))
          .filter((item) => item.idMedidor > 0)

        if (!payload?.idEmpleado) {
          throw new Error('Selecciona un lecturista para asignar la hoja de ruta.')
        }

        if (!selectedMeters.length) {
          throw new Error('Selecciona al menos un medidor activo.')
        }

        try {
          const created = await jsonFetch(apiUrl('/rutas-medicion'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              IdEmpleado: Number(payload.idEmpleado),
              Nombre: payload.nombre || `Ruta de mediciones ${new Date().toLocaleDateString('es-AR')}`,
              Fecha: payload.fecha || new Date().toISOString().slice(0, 10),
              Medidores: selectedMeters.map((item) => item.idMedidor),
              Observacion: payload.observacion || ''
            })
          })
          const normalized = normalizeMeasurementRoute(created)
          set((state) => ({
            measurementRoutes: [
              normalized,
              ...state.measurementRoutes.filter((route) => String(route.idRutaMedicion) !== String(normalized.idRutaMedicion))
            ]
          }))
          return normalized
        } catch (error) {
          if (!String(error.message || '').includes('Failed to fetch')) {
            throw error
          }
          throw new Error('La API no esta disponible. La hoja de ruta no fue creada.')
        }

      },

      startMeasurementRoute: async (routeId) => {
        try {
          const updated = await jsonFetch(apiUrl(`/rutas-medicion/${routeId}/iniciar`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          })
          const normalized = normalizeMeasurementRoute(updated)
          set((state) => ({
            measurementRoutes: state.measurementRoutes.map((route) =>
              String(route.idRutaMedicion) === String(routeId) ? normalized : route
            )
          }))
          return normalized
        } catch (error) {
          if (!String(error.message || '').includes('Failed to fetch')) {
            throw error
          }
          throw new Error('La API no esta disponible. La hoja de ruta no fue iniciada.')
        }

      },

      saveMeasurementRouteReading: async (routeId, meterId, payload) => {
        try {
          const updated = await jsonFetch(apiUrl(`/rutas-medicion/${routeId}/detalle/${meterId}/lectura`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              IdEmpleado: Number(payload.idEmpleado),
              IdTipoLectura: Number(payload.idTipoLectura),
              LecturaActual: Number(payload.lecturaActual),
              FechaLectura: payload.fechaLectura || new Date().toISOString().slice(0, 10),
              Observacion: payload.observacion || '',
              Latitud: payload.latitud ?? null,
              Longitud: payload.longitud ?? null,
              FotoMedidorUrl: payload.fotoMedidorUrl || '',
              FotoBase64: payload.photo?.Base64 || '',
              NombreFoto: payload.photo?.Nombre || '',
              TipoFoto: payload.photo?.Tipo || ''
            })
          })
          const normalized = normalizeMeasurementRoute(updated)
          set((state) => ({
            measurementRoutes: state.measurementRoutes.map((route) =>
              String(route.idRutaMedicion) === String(routeId) ? normalized : route
            )
          }))
          return normalized
        } catch (error) {
          if (!String(error.message || '').includes('Failed to fetch')) {
            throw error
          }
          throw new Error('La API no esta disponible. La lectura no fue registrada.')
        }

      },

      updateMeasurementRouteItem: async (routeId, meterId, payload) => {
        try {
          if (payload.estado && payload.estado !== 'Medido') {
            const updated = await jsonFetch(apiUrl(`/rutas-medicion/${routeId}/detalle/${meterId}/estado`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                Estado: payload.estado || null,
                idMotivoEvento: payload.idMotivoEvento || null,
                OperacionId: payload.operacionId || null,
                Observacion: payload.observacion || ''
              })
            })
            const normalized = normalizeMeasurementRoute(updated)
            set((state) => ({
              measurementRoutes: state.measurementRoutes.map((route) =>
                String(route.idRutaMedicion) === String(routeId) ? normalized : route
              )
            }))
            return normalized
          }
        } catch (error) {
          if (!String(error.message || '').includes('Failed to fetch')) {
            throw error
          }
          throw new Error('La API no esta disponible. El estado no fue actualizado.')
        }

        throw new Error("Seleccioná un estado de incidencia válido.")
      },

      completeMeasurementRoute: async (routeId, payload = {}) => {
        try {
          const updated = await jsonFetch(apiUrl(`/rutas-medicion/${routeId}/finalizar`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              FirmaBase64: payload.firmaDigital || payload.FirmaBase64 || '',
              Observacion: payload.observacion || ''
            })
          })
          const normalized = normalizeMeasurementRoute(updated)
          set((state) => ({
            measurementRoutes: state.measurementRoutes.map((route) =>
              String(route.idRutaMedicion) === String(routeId) ? normalized : route
            )
          }))
          return normalized
        } catch (error) {
          if (!String(error.message || '').includes('Failed to fetch')) {
            throw error
          }
          throw new Error('La API no esta disponible. La hoja de ruta no fue finalizada.')
        }

      }
    }),
    {
      name: 'cooperativa-service-workflow',
      version: 3,
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState
        let nextState = persistedState

        if (version < 2) {
          nextState = {
            ...nextState,
            requests: []
          }
        }

        if (version < 3) {
          nextState = {
            ...nextState,
            measurementRoutes: []
          }
        }

        return nextState
      }
    }
  )
)

export { SERVICE_REQUEST_STATUSES }
export default useServiceWorkflowStore
