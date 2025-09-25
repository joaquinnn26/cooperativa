<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header del Dashboard Admin -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Panel de Administración
      </h1>
      <p class="text-lg text-gray-600">
        Gestiona la cooperativa desde aquí
      </p>
    </div>

    <!-- Estadísticas Generales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <Users class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Socios</p>
            <p class="text-2xl font-bold text-gray-900">1,247</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <Droplet class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Servicios Agua</p>
            <p class="text-2xl font-bold text-gray-900">1,180</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
            <Zap class="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Servicios Luz</p>
            <p class="text-2xl font-bold text-gray-900">1,156</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <AlertCircle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Reportes Pendientes</p>
            <p class="text-2xl font-bold text-gray-900">23</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones de Administración -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <!-- Gestión de Socios -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Gestión de Socios</h2>
        <div class="space-y-4">
          <NuxtLink 
            to="/admin/socios" 
            class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users class="w-8 h-8 text-blue-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Ver Todos los Socios</h3>
              <p class="text-sm text-gray-600">Gestionar cuentas de socios</p>
            </div>
          </NuxtLink>
          
          <NuxtLink 
            to="/admin/socios/nuevo" 
            class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <UserPlus class="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Agregar Nuevo Socio</h3>
              <p class="text-sm text-gray-600">Registrar nuevo socio</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Gestión de Servicios -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Gestión de Servicios</h2>
        <div class="space-y-4">
          <NuxtLink 
            to="/admin/servicios" 
            class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Settings class="w-8 h-8 text-purple-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Configurar Servicios</h3>
              <p class="text-sm text-gray-600">Gestionar servicios disponibles</p>
            </div>
          </NuxtLink>
          
          <NuxtLink 
            to="/admin/lecturas" 
            class="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <BarChart3 class="w-8 h-8 text-orange-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Registrar Lecturas</h3>
              <p class="text-sm text-gray-600">Ingresar lecturas de medidores</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Facturación y Reportes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <!-- Facturación -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Facturación</h2>
        <div class="space-y-4">
          <NuxtLink 
            to="/admin/facturas" 
            class="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Receipt class="w-8 h-8 text-indigo-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Generar Facturas</h3>
              <p class="text-sm text-gray-600">Crear facturas mensuales</p>
            </div>
          </NuxtLink>
          
          <NuxtLink 
            to="/admin/pagos" 
            class="flex items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <CreditCard class="w-8 h-8 text-emerald-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Gestionar Pagos</h3>
              <p class="text-sm text-gray-600">Ver y procesar pagos</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Reportes y Anuncios -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Comunicación</h2>
        <div class="space-y-4">
          <NuxtLink 
            to="/admin/anuncios" 
            class="flex items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <Megaphone class="w-8 h-8 text-pink-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Crear Anuncios</h3>
              <p class="text-sm text-gray-600">Publicar comunicados</p>
            </div>
          </NuxtLink>
          
          <NuxtLink 
            to="/admin/reportes" 
            class="flex items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <FileText class="w-8 h-8 text-teal-600 mr-4" />
            <div>
              <h3 class="font-semibold text-gray-900">Generar Reportes</h3>
              <p class="text-sm text-gray-600">Estadísticas y análisis</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Actividad Reciente -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 mb-6">Actividad Reciente</h2>
      <div class="space-y-4">
        <div 
          v-for="activity in recentActivities" 
          :key="activity.id"
          class="flex items-center p-4 bg-gray-50 rounded-lg"
        >
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center mr-4"
            :class="getActivityColor(activity.type)"
          >
            <component :is="getActivityIcon(activity.type)" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">{{ activity.title }}</h3>
            <p class="text-sm text-gray-600">{{ activity.description }}</p>
          </div>
          <div class="text-sm text-gray-500">
            {{ formatTime(activity.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Users, Droplet, Zap, AlertCircle, UserPlus, Settings, 
  BarChart3, Receipt, CreditCard, Megaphone, FileText,
  User, AlertTriangle, CheckCircle
} from 'lucide-vue-next'

definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()

const recentActivities = ref([
  {
    id: 1,
    type: 'user',
    title: 'Nuevo socio registrado',
    description: 'María González se registró en el sistema',
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutos atrás
  },
  {
    id: 2,
    type: 'payment',
    title: 'Pago procesado',
    description: 'Factura #1234 pagada por Juan Pérez',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 horas atrás
  },
  {
    id: 3,
    type: 'alert',
    title: 'Reporte de problema',
    description: 'Corte de agua reportado en Calle Principal',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 horas atrás
  }
])

const getActivityIcon = (type) => {
  const icons = {
    user: User,
    payment: CheckCircle,
    alert: AlertTriangle
  }
  return icons[type] || AlertCircle
}

const getActivityColor = (type) => {
  const colors = {
    user: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600',
    alert: 'bg-red-100 text-red-600'
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

const formatTime = (timestamp) => {
  const now = new Date()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 60) {
    return `Hace ${minutes} minutos`
  } else if (hours < 24) {
    return `Hace ${hours} horas`
  } else {
    return timestamp.toLocaleDateString('es-ES')
  }
}
</script>
