<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Droplet class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900">Cooperativa</h1>
                <p class="text-sm text-gray-600">Agua y Luz</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <NuxtLink 
              to="/" 
              class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
              active-class="text-blue-600 bg-blue-50"
            >
              Inicio
            </NuxtLink>
            <NuxtLink 
              to="/servicios" 
              class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
              active-class="text-blue-600 bg-blue-50"
            >
              Servicios
            </NuxtLink>
            <NuxtLink 
              to="/facturas" 
              class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
              active-class="text-blue-600 bg-blue-50"
            >
              Facturas
            </NuxtLink>
            <NuxtLink 
              to="/ayuda" 
              class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
              active-class="text-blue-600 bg-blue-50"
            >
              Ayuda
            </NuxtLink>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isLoggedIn">
              <div class="flex items-center space-x-3">
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">{{ authStore.user.name }}</p>
                  <p class="text-xs text-gray-600">{{ authStore.userType === 'admin' ? 'Administrador' : 'Socio' }}</p>
                </div>
                <button 
                  @click="authStore.logout"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Salir
                </button>
              </div>
            </template>
            <template v-else>
              <NuxtLink 
                to="/login" 
                class="btn-primary text-sm"
              >
                Iniciar Sesión
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">Contacto</h3>
            <div class="space-y-2 text-gray-300">
              <p>📞 (555) 123-4567</p>
              <p>📧 info@cooperativa.com</p>
              <p>📍 Av. Principal 123, Ciudad</p>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Horarios</h3>
            <div class="space-y-2 text-gray-300">
              <p>Lunes - Viernes: 8:00 - 17:00</p>
              <p>Sábados: 8:00 - 12:00</p>
              <p>Domingos: Cerrado</p>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Enlaces Útiles</h3>
            <div class="space-y-2">
              <NuxtLink to="/ayuda" class="block text-gray-300 hover:text-white transition-colors">Ayuda</NuxtLink>
              <NuxtLink to="/contacto" class="block text-gray-300 hover:text-white transition-colors">Contacto</NuxtLink>
              <NuxtLink to="/terminos" class="block text-gray-300 hover:text-white transition-colors">Términos y Condiciones</NuxtLink>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Cooperativa de Agua y Luz. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>

    <!-- Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div 
        v-for="notification in appStore.notifications" 
        :key="notification.id"
        class="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      >
        <div class="flex items-start">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
            <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
          </div>
          <button 
            @click="appStore.removeNotification(notification.id)"
            class="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Droplet, X } from 'lucide-vue-next'

const authStore = useAuthStore()
const appStore = useAppStore()
</script>
