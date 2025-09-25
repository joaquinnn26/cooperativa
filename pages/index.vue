<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section con Video Tutorial -->
    <section class="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            Bienvenido a la Cooperativa
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-blue-100">
            Portal web para socios de agua y luz
          </p>
          
          <!-- Video Tutorial -->
          <div class="max-w-4xl mx-auto mb-12">
            <div class="bg-white rounded-xl shadow-2xl p-4">
              <div class="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div class="text-center text-white">
                  <Play class="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h3 class="text-xl font-semibold mb-2">Tutorial de Uso</h3>
                  <p class="text-gray-300">Aprende a usar el portal paso a paso</p>
                  <button 
                    @click="playTutorial"
                    class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Ver Tutorial
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de Acceso -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink 
              to="/login" 
              class="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              Iniciar Sesión
            </NuxtLink>
            <NuxtLink 
              to="/register" 
              class="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              Registrarse
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Servicios Principales -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
          Nuestros Servicios
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Servicio de Agua -->
          <div class="card text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Droplet class="w-8 h-8 text-blue-600" />
            </div>
            <h3 class="text-2xl font-semibold text-gray-900 mb-4">Servicio de Agua</h3>
            <p class="text-gray-600 mb-6 text-lg">
              Gestión completa del servicio de agua potable para tu hogar
            </p>
            <ul class="text-left space-y-2 text-gray-600">
              <li class="flex items-center">
                <Check class="w-5 h-5 text-green-500 mr-2" />
                Consulta de consumos
              </li>
              <li class="flex items-center">
                <Check class="w-5 h-5 text-green-500 mr-2" />
                Pago de facturas
              </li>
              <li class="flex items-center">
                <Check class="w-5 h-5 text-green-500 mr-2" />
                Reporte de problemas
              </li>
            </ul>
          </div>

          <!-- Servicio de Luz -->
          <div class="card text-center">
            <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap class="w-8 h-8 text-yellow-600" />
            </div>
            <h3 class="text-2xl font-semibold text-gray-900 mb-4">Servicio de Luz</h3>
            <p class="text-gray-600 mb-6 text-lg">
              Control y gestión del servicio eléctrico de tu vivienda
            </p>
            <ul class="text-left space-y-2 text-gray-600">
              <li class="flex items-center">
                <Check class="w-5 h-5 text-green-500 mr-2" />
                Monitoreo de consumo
              </li>
              <li class="flex items-center">
                <Check class="w-5 h-5 text-green-500 mr-2" />
                Pago en línea
              </li>
              <li class="flex items-center">
                <Check class="w-5 h-5 text-green-500 mr-2" />
                Solicitud de servicios
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Sección de Ayuda -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
          ¿Necesitas Ayuda?
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Guía de Uso -->
          <div class="card text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Guía de Uso</h3>
            <p class="text-gray-600 mb-6">
              Aprende a usar todas las funciones del portal
            </p>
            <NuxtLink 
              to="/ayuda/guia" 
              class="btn-primary"
            >
              Ver Guía
            </NuxtLink>
          </div>

          <!-- Preguntas Frecuentes -->
          <div class="card text-center">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle class="w-8 h-8 text-purple-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h3>
            <p class="text-gray-600 mb-6">
              Encuentra respuestas a las preguntas más comunes
            </p>
            <NuxtLink 
              to="/ayuda/faq" 
              class="btn-primary"
            >
              Ver FAQ
            </NuxtLink>
          </div>

          <!-- Contacto -->
          <div class="card text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Contacto</h3>
            <p class="text-gray-600 mb-6">
              Contáctanos si necesitas ayuda personalizada
            </p>
            <NuxtLink 
              to="/contacto" 
              class="btn-primary"
            >
              Contactar
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Anuncios Recientes -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
          Anuncios Importantes
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            v-for="announcement in announcements" 
            :key="announcement.id"
            class="card border-l-4"
            :class="announcement.priority === 'high' ? 'border-red-500' : 'border-blue-500'"
          >
            <div class="flex items-start">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                  {{ announcement.title }}
                </h3>
                <p class="text-gray-600 mb-4">
                  {{ announcement.content }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(announcement.date) }}
                </p>
              </div>
              <div 
                v-if="announcement.priority === 'high'"
                class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium"
              >
                Urgente
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Play, Droplet, Zap, Check, BookOpen, HelpCircle, Phone } from 'lucide-vue-next'

const cooperativeStore = useCooperativeStore()

// Cargar anuncios
const announcements = await cooperativeStore.fetchAnnouncements()

const playTutorial = () => {
  // Aquí implementarías la lógica para mostrar el video tutorial
  console.log('Reproducir tutorial')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Meta tags para SEO
useHead({
  title: 'Cooperativa de Agua y Luz - Portal Web',
  meta: [
    { name: 'description', content: 'Portal web para socios de la cooperativa de agua y luz. Gestiona tus servicios, facturas y más.' }
  ]
})
</script>
