import { create } from 'zustand'

const initialServices = [
  {
    id: 1,
    name: 'Agua',
    icon: 'droplet',
    status: 'active',
    lastReading: '2024-01-15',
    consumption: '45 m³',
    amount: '$2,500'
  },
  {
    id: 2,
    name: 'Luz',
    icon: 'zap',
    status: 'active',
    lastReading: '2024-01-15',
    consumption: '320 kWh',
    amount: '$1,800'
  }
]

const initialBills = [
  {
    id: 1,
    service: 'Agua',
    period: 'Enero 2024',
    amount: '$2,500',
    dueDate: '2024-02-15',
    status: 'pending',
    consumption: '45 m³'
  },
  {
    id: 2,
    service: 'Luz',
    period: 'Enero 2024',
    amount: '$1,800',
    dueDate: '2024-02-15',
    status: 'pending',
    consumption: '320 kWh'
  }
]

const initialAnnouncements = [
  {
    id: 1,
    title: 'Mantenimiento programado',
    content:
      'Se realizará mantenimiento en la red de agua el próximo viernes de 8:00 a 12:00.',
    date: '2024-01-20',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Nuevos horarios de atención',
    content: 'Los horarios de atención han cambiado. Consulta los nuevos horarios en nuestra página.',
    date: '2024-01-18',
    priority: 'medium'
  }
]

const useCooperativeStore = create((set, get) => ({
  services: initialServices,
  bills: initialBills,
  announcements: initialAnnouncements,

  fetchServices: async () => get().services,
  fetchBills: async () => get().bills,
  fetchAnnouncements: async () => get().announcements,

  payBill: async (billId) => {
    set((state) => ({
      bills: state.bills.map((bill) =>
        bill.id === billId ? { ...bill, status: 'paid' } : bill
      )
    }))
  }
}))

export default useCooperativeStore
