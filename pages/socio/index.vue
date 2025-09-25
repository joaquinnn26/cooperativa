<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header del Dashboard -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        ¡Hola, {{ authStore.user?.name }}!
      </h1>
      <p class="text-lg text-gray-600">
        Bienvenido a tu panel de socio
      </p>
    </div>

    <!-- Resumen de Servicios -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div 
        v-for="service in services" 
        :key="service.id"
        class="card"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              :class="service.name === 'Agua' ? 'bg-blue-100' : 'bg-yellow-100'"
            >
              <Droplet v-if="service.name === 'Agua'" class="w-6 h-6 text-blue-600" />
              <Zap v-else class="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">{{ service.name }}</h3>
              <p class="text-sm text-gray-600">Última lectura: {{ service.lastReading }}</p>
            </div>
          </div>
          <div 
            class="px-3 py-1 rounded-full text-sm font-medium"
            :class="service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            {{ service.status === 'active' ? 'Activo' : 'Inactivo' }}
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Consumo</p>
            <p class="text-lg font-semibold text-gray-900">{{ service.consumption }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Monto</p>
            <p class="text-lg font-semibold text-gray-900">{{ service.amount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Facturas Pendientes -->
    <div class="card mb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Facturas Pendientes</h2>
        <NuxtLink 
          to="/facturas" 
          class="text-blue-600 hover:text-blue-500 font-medium"
        >
          Ver todas
        </NuxtLink>
      </div>
      
      <div class="space-y-4">
        <div 
          v-for="bill in pendingBills" 
          :key="bill.id"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center mr-4"
              :class="bill.service === 'Agua' ? 'bg-blue-100' : 'bg-yellow-100'"
            >
              <Droplet v-if="bill.service === 'Agua'" class="w-5 h-5 text-blue-600" />
              <Zap v-else class="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ bill.service }} - {{ bill.period }}</h3>
              <p class="text-sm text-gray-600">Vence: {{ formatDate(bill.dueDate) }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="font-semibold text-gray-900">{{ bill.amount }}</p>
              <p class="text-sm text-gray-600">{{ bill.consumption }}</p>
            </div>
            <button 
              @click="payBill(bill.id)"
              class="btn-primary text-sm"
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones Rápidas -->
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink 
          to="/servicios" 
          class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Settings class="w-8 h-8 text-blue-600 mr-4" />
          <div>
            <h3 class="font-semibold text-gray-900">Mis Servicios</h3>
            <p class="text-sm text-gray-600">Gestionar servicios</p>
          </div>
        </NuxtLink>
        
        <NuxtLink 
          to="/facturas" 
          class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Receipt class="w-8 h-8 text-green-600 mr-4" />
          <div>
            <h3 class="font-semibold text-gray-900">Facturas</h3>
            <p class="text-sm text-gray-600">Ver historial</p>
          </div>
        </NuxtLink>
        
        <NuxtLink 
          to="/reportes" 
          class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <AlertTriangle class="w-8 h-8 text-purple-600 mr-4" />
          <div>
            <h3 class="font-semibold text-gray-900">Reportar Problema</h3>
            <p class="text-sm text-gray-600">Solicitar servicio</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Droplet, Zap, Settings, Receipt, AlertTriangle } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const cooperativeStore = useCooperativeStore()
const appStore = useAppStore()

// Cargar datos
const services = await cooperativeStore.fetchServices()
const bills = await cooperativeStore.fetchBills()

const pendingBills = computed(() => 
  bills.filter(bill => bill.status === 'pending')
)

const payBill = async (billId) => {
  try {
    await cooperativeStore.payBill(billId)
    appStore.addNotification({
      title: '¡Éxito!',
      message: 'Factura pagada correctamente',
      type: 'success'
    })
  } catch (error) {
    appStore.addNotification({
      title: 'Error',
      message: 'No se pudo procesar el pago',
      type: 'error'
    })
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
