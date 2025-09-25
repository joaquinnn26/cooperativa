export const useCooperativeStore = defineStore('cooperative', () => {
  const services = ref([
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
  ])

  const bills = ref([
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
  ])

  const announcements = ref([
    {
      id: 1,
      title: 'Mantenimiento programado',
      content: 'Se realizará mantenimiento en la red de agua el próximo viernes de 8:00 a 12:00.',
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
  ])

  const fetchServices = async () => {
    // Simulación de API call
    return services.value
  }

  const fetchBills = async () => {
    // Simulación de API call
    return bills.value
  }

  const fetchAnnouncements = async () => {
    // Simulación de API call
    return announcements.value
  }

  const payBill = async (billId) => {
    // Simulación de pago
    const bill = bills.value.find(b => b.id === billId)
    if (bill) {
      bill.status = 'paid'
    }
  }

  return {
    services: readonly(services),
    bills: readonly(bills),
    announcements: readonly(announcements),
    fetchServices,
    fetchBills,
    fetchAnnouncements,
    payBill
  }
})
