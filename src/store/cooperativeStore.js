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

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    ...options
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `HTTP ${res.status}`)
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

const useCooperativeStore = create(
  persist(
    (set, get) => ({
      services: initialServices,
      bills: [],
      announcements: initialAnnouncements,

      fetchServices: async () => get().services,
      fetchAnnouncements: async () => get().announcements,
      fetchBills: async () => {
        const data = await jsonFetch(apiUrl('/factura'))
        const normalized = ensureArray(data)
          .map(normalizeBillFromApi)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

        set((state) => ({ ...state, bills: normalized }))
        return normalized
      },
      fetchBillsBySocio: async ({ idSocio = null, usuario = null } = {}) => {
        if (idSocio != null) {
          const data = await jsonFetch(apiUrl(`/factura/socio/${idSocio}`))
          return ensureArray(data)
            .map(normalizeBillFromApi)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        }

        return (await get().fetchBills()).filter(
          (bill) => usuario != null && String(bill.socioUsuario) === String(usuario)
        )
      },

      createBill: async (payload) => {
        const created = await jsonFetch(apiUrl('/factura'), {
          method: 'POST',
          body: JSON.stringify({
            idSocio: Number(payload.idSocio),
            idEmpleado: Number(payload.idEmpleado),
            idServicio: Number(payload.idServicio),
            MontoTotal: Number(payload.amount),
            FechaCaducidad: payload.dueDate,
            LinkPago: payload.paymentLink || '',
            Observaciones: payload.observations || ''
          })
        })

        await get().fetchBills()
        return created
      },

      updateBill: async (payload) => {
        const result = await jsonFetch(apiUrl(`/factura/${payload.id}`), {
          method: 'PUT',
          body: JSON.stringify({
            idServicio: Number(payload.idServicio),
            MontoTotal: Number(payload.amount),
            FechaCaducidad: payload.dueDate,
            LinkPago: payload.paymentLink || '',
            Observaciones: payload.observations || ''
          })
        })

        await get().fetchBills()
        return result
      },

      payBill: async (billId) => {
        const result = await jsonFetch(apiUrl(`/factura/pagar/${billId}`), {
          method: 'PUT',
          body: JSON.stringify({
            Pagada: true
          })
        })

        await get().fetchBills()
        return result
      },

      updateBillStatus: async (bill, nextStatus) => {
        if (!bill?.id) {
          throw new Error('Factura invalida.')
        }

        const today = new Date()
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + 7)

        const pastDate = new Date(today)
        pastDate.setDate(pastDate.getDate() - 7)

        if (nextStatus === 'paid') {
          await jsonFetch(apiUrl(`/factura/pagar/${bill.id}`), {
            method: 'PUT',
            body: JSON.stringify({
              Pagada: true
            })
          })
        } else {
          await jsonFetch(apiUrl(`/factura/pagar/${bill.id}`), {
            method: 'PUT',
            body: JSON.stringify({
              Pagada: false
            })
          })

          const nextDueDate = nextStatus === 'overdue' ? pastDate : futureDate

          await jsonFetch(apiUrl(`/factura/${bill.id}`), {
            method: 'PUT',
            body: JSON.stringify({
              idServicio: Number(bill.idServicio),
              MontoTotal: Number(bill.amount),
              FechaCaducidad: nextDueDate.toISOString(),
              LinkPago: bill.paymentLink || '',
              Observaciones: bill.observations || ''
            })
          })
        }

        await get().fetchBills()
      }
    }),
    {
      name: 'cooperativa-billing'
    }
  )
)

export default useCooperativeStore
