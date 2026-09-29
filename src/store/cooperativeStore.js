import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiUrl } from '@/config/api.js'

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

const initialAnnouncements = [
  {
    id: 1,
    title: 'Mantenimiento programado',
    content:
      'Se realizara mantenimiento en la red de agua el proximo viernes de 8:00 a 12:00.',
    date: '2024-01-20',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Nuevos horarios de atencion',
    content: 'Los horarios de atencion han cambiado. Consulta los nuevos horarios en nuestra pagina.',
    date: '2024-01-18',
    priority: 'medium'
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

async function firstSuccessfulJson(paths, options) {
  let lastError = null

  for (const path of paths) {
    try {
      return await jsonFetch(apiUrl(path), options)
    } catch (error) {
      lastError = error
      if (![404, 405].includes(error.status)) break
    }
  }

  throw lastError || new Error('No se pudo completar la operacion.')
}

function nextAnnouncementId(items) {
  return items.length ? Math.max(...items.map((item) => Number(item.id) || 0)) + 1 : 1
}

function apiModuleUnavailable(error) {
  return [404, 405].includes(error?.status) || String(error?.message || '').includes('Failed to fetch')
}

const useCooperativeStore = create(
  persist(
    (set, get) => ({
      services: initialServices,
      bills: [],
      announcements: initialAnnouncements,

      fetchServices: async () => get().services,
      fetchAnnouncements: async () => {
        try {
          const data = await firstSuccessfulJson(['/anuncios', '/anuncio'])
          const normalized = ensureArray(data).map(normalizeAnnouncementFromApi)
          set((state) => ({ ...state, announcements: normalized }))
          return normalized
        } catch (error) {
          if (!apiModuleUnavailable(error)) throw error
          return get().announcements.filter((announcement) => announcement.active !== false)
        }
      },
      fetchAnnouncementsAdmin: async () => {
        try {
          const data = await firstSuccessfulJson(['/anuncios/admin', '/anuncio/admin', '/anuncios', '/anuncio'])
          const normalized = ensureArray(data).map(normalizeAnnouncementFromApi)
          set((state) => ({ ...state, announcements: normalized }))
          return normalized
        } catch (error) {
          if (!apiModuleUnavailable(error)) throw error
          return get().announcements
        }
      },
      createAnnouncement: async (payload) => {
        try {
          const created = await firstSuccessfulJson(['/anuncios', '/anuncio'], {
            method: 'POST',
            body: JSON.stringify(announcementPayload(payload))
          })

          await get().fetchAnnouncementsAdmin()
          return normalizeAnnouncementFromApi(created)
        } catch (error) {
          if (!apiModuleUnavailable(error)) throw error

          const created = {
            id: nextAnnouncementId(get().announcements),
            title: payload.title,
            content: payload.content,
            priority: payload.priority || 'medium',
            date: new Date().toISOString(),
            startsAt: payload.startsAt || '',
            endsAt: payload.endsAt || '',
            active: payload.active !== false,
            fixed: Boolean(payload.fixed),
            idEmpleado: payload.idEmpleado || null
          }

          set((state) => ({ ...state, announcements: [created, ...state.announcements] }))
          return created
        }
      },
      updateAnnouncement: async (id, payload) => {
        try {
          const updated = await firstSuccessfulJson([`/anuncios/${id}`, `/anuncio/${id}`], {
            method: 'PUT',
            body: JSON.stringify(announcementPayload(payload))
          })

          await get().fetchAnnouncementsAdmin()
          return normalizeAnnouncementFromApi(updated)
        } catch (error) {
          if (!apiModuleUnavailable(error)) throw error

          let updatedAnnouncement = null
          set((state) => ({
            ...state,
            announcements: state.announcements.map((announcement) => {
              if (String(announcement.id) !== String(id)) return announcement
              updatedAnnouncement = {
                ...announcement,
                title: payload.title,
                content: payload.content,
                priority: payload.priority || 'medium',
                startsAt: payload.startsAt || '',
                endsAt: payload.endsAt || '',
                active: payload.active !== false,
                fixed: Boolean(payload.fixed),
                idEmpleado: payload.idEmpleado || announcement.idEmpleado || null
              }
              return updatedAnnouncement
            })
          }))

          return updatedAnnouncement
        }
      },
      deactivateAnnouncement: async (id) => {
        try {
          const updated = await firstSuccessfulJson([`/anuncios/${id}`, `/anuncio/${id}`], {
            method: 'DELETE'
          })

          await get().fetchAnnouncementsAdmin()
          return updated ? normalizeAnnouncementFromApi(updated) : null
        } catch (error) {
          if (!apiModuleUnavailable(error)) throw error

          let updatedAnnouncement = null
          set((state) => ({
            ...state,
            announcements: state.announcements.map((announcement) => {
              if (String(announcement.id) !== String(id)) return announcement
              updatedAnnouncement = { ...announcement, active: false }
              return updatedAnnouncement
            })
          }))

          return updatedAnnouncement
        }
      },
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
      name: 'cooperativa-billing'
    }
  )
)

export default useCooperativeStore
