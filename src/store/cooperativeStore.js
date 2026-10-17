import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiUrl } from '@/config/api.js'
import { fetchPublicAnnouncements } from '../features/home/publicAnnouncements.js'

const initialServices = [
  {
    id: 1,
    name: 'Agua',
    icon: 'droplet',
    status: 'active',
    lastReading: 'Sin lecturas',
    consumption: '0',
    amount: '$0'
  },
  {
    id: 2,
    name: 'Luz',
    icon: 'zap',
    status: 'active',
    lastReading: 'Sin lecturas',
    consumption: '0',
    amount: '$0'
  }
]

function normalizeAnnouncementPriority(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (['alta', 'high'].includes(normalized)) return 'high'
  if (['baja', 'low'].includes(normalized)) return 'low'
  return 'medium'
}

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) }
  })

  if (!res.ok) {
    const errorText = await res.text()
    let message = errorText
    try {
      const parsed = JSON.parse(errorText)
      message = parsed.Message || parsed.message || parsed.error || errorText
    } catch {
      // The API may return a plain functional message.
    }
    const error = new Error(message || `HTTP ${res.status}`)
    error.status = res.status
    throw error
  }

  return res.status === 204 ? null : res.json()
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.value)) return data.value
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function normalizeBillStatus(rawStatus, dueDate) {
  const normalized = String(rawStatus || '').trim().toLowerCase()

  if (['pagada', 'paid'].includes(normalized)) return 'paid'
  if (['vencida', 'overdue'].includes(normalized)) return 'overdue'

  const parsedDueDate = dueDate ? new Date(dueDate) : null
  if (parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) && parsedDueDate < new Date()) {
    return 'overdue'
  }

  return 'pending'
}

function normalizeBillFromApi(bill) {
  const socio = bill.Socio || bill.socio || {}
  const dueDate = pickFirst(bill.FechaCaducidad, bill.fechaCaducidad, bill.dueDate)
  const emissionDate = pickFirst(bill.FechaEmision, bill.fechaEmision, bill.createdAt)

  return {
    id: pickFirst(bill.idFactura, bill.IdFactura, bill.id),
    idSocio: pickFirst(bill.idSocio, bill.IdSocio, socio.idSocio),
    socioUsuario: pickFirst(socio.Documento, socio.documento, bill.socioUsuario, ''),
    socioNombre: pickFirst(
      [socio.Nombre, socio.Apellido].filter(Boolean).join(' ').trim(),
      bill.socioNombre,
      'Socio'
    ),
    idServicio: pickFirst(bill.idServicio, bill.IdServicio, bill.Servicio?.idServicio),
    service: pickFirst(
      bill.Servicio?.Nombre,
      bill.servicio?.Nombre,
      bill.ServicioNombre,
      bill.servicioNombre,
      bill.service,
      'Servicio'
    ),
    amount: Number(pickFirst(bill.MontoTotal, bill.montoTotal, bill.amount, 0)),
    dueDate,
    createdAt: emissionDate,
    period: emissionDate
      ? new Date(emissionDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      : '',
    paymentLink: pickFirst(bill.LinkPago, bill.linkPago, bill.paymentLink, ''),
    paidAt: pickFirst(bill.FechaPago, bill.fechaPago, bill.paidAt, null),
    observations: pickFirst(bill.Observaciones, bill.observaciones, ''),
    status: normalizeBillStatus(pickFirst(bill.Estado, bill.estado, bill.status), dueDate)
  }
}

function normalizeAnnouncementFromApi(announcement) {
  return {
    id: pickFirst(announcement.idAnuncio, announcement.IdAnuncio, announcement.id),
    title: pickFirst(announcement.Titulo, announcement.titulo, announcement.title, ''),
    content: pickFirst(announcement.Contenido, announcement.contenido, announcement.content, ''),
    priority: normalizeAnnouncementPriority(pickFirst(announcement.Prioridad, announcement.prioridad, announcement.priority)),
    date: pickFirst(announcement.FechaPublicacion, announcement.fechaPublicacion, announcement.date),
    startsAt: pickFirst(announcement.FechaInicio, announcement.fechaInicio, announcement.startsAt, ''),
    endsAt: pickFirst(announcement.FechaFin, announcement.fechaFin, announcement.endsAt, ''),
    active: Boolean(pickFirst(announcement.Activo, announcement.activo, announcement.active, true)),
    fixed: Boolean(pickFirst(announcement.Fijo, announcement.fijo, announcement.fixed, false)),
    idEmpleado: pickFirst(announcement.idEmpleado, announcement.IdEmpleado, announcement.employeeId, null)
  }
}

function announcementPayload(payload) {
  const priorities = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  }

  return {
    Titulo: payload.title,
    Contenido: payload.content,
    Prioridad: priorities[payload.priority] || 'Media',
    FechaInicio: payload.startsAt || null,
    FechaFin: payload.endsAt || null,
    Activo: payload.active !== false,
    Fijo: Boolean(payload.fixed),
    idEmpleado: payload.idEmpleado != null && payload.idEmpleado !== '' ? Number(payload.idEmpleado) : null,
    IdEmpleado: payload.idEmpleado != null && payload.idEmpleado !== '' ? Number(payload.idEmpleado) : null
  }
}

const useCooperativeStore = create(
  persist(
    (set, get) => ({
      services: initialServices,
      bills: [],
      announcements: [],
      announcementOutcomeUncertain: false,

      fetchServices: async () => get().services,
      fetchAnnouncements: async () => {
        return fetchPublicAnnouncements(apiUrl('/anuncios'))
      },
      fetchAnnouncementsAdmin: async () => {
        const data = await jsonFetch(apiUrl('/anuncios/admin'))
        const items = Array.isArray(data) ? data : data?.$values
        if (!Array.isArray(items)) throw new Error('La respuesta de anuncios no es válida.')
        const announcements = items.map(normalizeAnnouncementFromApi)
        set({ announcements, announcementOutcomeUncertain: false })
        return announcements
      },
      mutateAnnouncement: async (path, options) => {
        if (get().announcementOutcomeUncertain) throw new Error('Actualizá el listado antes de realizar otra operación: el último resultado no pudo confirmarse.')
        try {
          const data = await jsonFetch(apiUrl(path), options)
          if (!data || !data.idAnuncio) throw new Error('La API no confirmó el resultado de la operación.')
          return normalizeAnnouncementFromApi(data)
        } catch (error) {
          if (!error.status || error.status >= 500) {
            set({ announcementOutcomeUncertain: true })
            try { await get().fetchAnnouncementsAdmin() } catch { /* Keep writes blocked until a successful read. */ }
            const uncertain = new Error('No se pudo confirmar el guardado. Revisá el listado actualizado antes de volver a intentarlo.')
            uncertain.uncertain = true
            throw uncertain
          }
          throw error
        }
      },
      createAnnouncement: async (payload) => get().mutateAnnouncement('/anuncios', {
        method: 'POST', body: JSON.stringify(announcementPayload(payload))
      }),
      updateAnnouncement: async (id, payload) => get().mutateAnnouncement('/anuncios/' + id, {
        method: 'PUT', body: JSON.stringify(announcementPayload(payload))
      }),
      deactivateAnnouncement: async (id) => get().mutateAnnouncement('/anuncios/' + id, {
        method: 'DELETE'
      }),
      fetchBills: async () => {
        const data = await jsonFetch(apiUrl('/factura'))
        const normalized = ensureArray(data)
          .map(normalizeBillFromApi)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

        set((state) => ({ ...state, bills: normalized }))
        return normalized
      },
      fetchBillsBySocio: async () => {
        let result = [], page = 1, total = 0
        do {
          const data = await jsonFetch(apiUrl(`/laboral/facturas?pagina=${page}`))
          total = data.total
          result.push(...data.items.map(b => ({ id: b.idFactura, idSocio: b.idSocio, serviceName: b.Servicio, amount: b.MontoTotal, dueDate: b.FechaCaducidad, createdAt: b.FechaEmision, paymentLink: b.LinkPago, status: b.EstadoConfirmado === 'Pagada' ? 'paid' : b.EstadoConfirmado === 'Pendiente' ? 'pending' : b.EstadoConfirmado === 'Anulada' ? 'cancelled' : 'unverified', confirmedAt: b.FechaActualizacionUtc })))
          page++
          if (!data.items.length) break
        } while (result.length < total)
        return result
      },

      createBill: async () => { throw new Error('La emisión de facturas corresponde al sistema externo.') },
      updateBill: async () => { throw new Error('La actualización requiere la integración contable acordada.') },
      payBill: async () => { throw new Error('El pago requiere confirmación verificable del sistema externo.') }

    }),
    {
      name: 'cooperativa-billing',
      partialize: ({ services, bills }) => ({ services, bills }),
      merge: (saved, current) => ({ ...current, services: saved?.services ?? current.services, bills: saved?.bills ?? current.bills })
    }
  )
)

export default useCooperativeStore
