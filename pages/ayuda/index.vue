<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Centro de Ayuda</h1>
    
    <!-- Navegación de Ayuda -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <NuxtLink 
        to="/ayuda/guia" 
        class="card text-center hover:shadow-md transition-shadow"
      >
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen class="w-8 h-8 text-green-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Guía de Uso</h2>
        <p class="text-gray-600">Aprende a usar todas las funciones del portal paso a paso</p>
      </NuxtLink>
      
      <NuxtLink 
        to="/ayuda/faq" 
        class="card text-center hover:shadow-md transition-shadow"
      >
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle class="w-8 h-8 text-blue-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Preguntas Frecuentes</h2>
        <p class="text-gray-600">Encuentra respuestas a las preguntas más comunes</p>
      </NuxtLink>
      
      <NuxtLink 
        to="/contacto" 
        class="card text-center hover:shadow-md transition-shadow"
      >
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone class="w-8 h-8 text-red-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Contacto</h2>
        <p class="text-gray-600">Contáctanos si necesitas ayuda personalizada</p>
      </NuxtLink>
    </div>

    <!-- Secciones de Ayuda -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Cómo Iniciar Sesión -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Cómo Iniciar Sesión</h2>
        <div class="space-y-4">
          <div class="flex items-start">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Ve a la página de inicio</h3>
              <p class="text-gray-600">Haz clic en "Iniciar Sesión" en la esquina superior derecha</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Ingresa tus datos</h3>
              <p class="text-gray-600">Escribe tu correo electrónico y contraseña</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Haz clic en "Iniciar Sesión"</h3>
              <p class="text-gray-600">Serás redirigido a tu panel personal</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cómo Ver Mis Facturas -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Cómo Ver Mis Facturas</h2>
        <div class="space-y-4">
          <div class="flex items-start">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-green-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Inicia sesión</h3>
              <p class="text-gray-600">Accede a tu cuenta de socio</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-green-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Ve a "Facturas"</h3>
              <p class="text-gray-600">Haz clic en el menú "Facturas" en la parte superior</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-green-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Revisa tus facturas</h3>
              <p class="text-gray-600">Verás todas tus facturas pendientes y pagadas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cómo Pagar una Factura -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Cómo Pagar una Factura</h2>
        <div class="space-y-4">
          <div class="flex items-start">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-purple-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Selecciona la factura</h3>
              <p class="text-gray-600">Encuentra la factura que deseas pagar</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-purple-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Haz clic en "Pagar"</h3>
              <p class="text-gray-600">Presiona el botón azul "Pagar"</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-purple-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Confirma el pago</h3>
              <p class="text-gray-600">Revisa los datos y confirma la transacción</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cómo Reportar un Problema -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Cómo Reportar un Problema</h2>
        <div class="space-y-4">
          <div class="flex items-start">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-red-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Ve a "Reportes"</h3>
              <p class="text-gray-600">Accede a la sección de reportes desde tu panel</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-red-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Describe el problema</h3>
              <p class="text-gray-600">Explica detalladamente qué está pasando</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span class="text-red-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Envía el reporte</h3>
              <p class="text-gray-600">Haz clic en "Enviar" y recibirás una respuesta pronto</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Información de Contacto -->
    <div class="card mt-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">¿Necesitas Más Ayuda?</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <Phone class="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 class="font-semibold text-gray-900 mb-2">Teléfono</h3>
          <p class="text-gray-600">(555) 123-4567</p>
          <p class="text-sm text-gray-500">Lunes a Viernes 8:00 - 17:00</p>
        </div>
        
        <div class="text-center">
          <Mail class="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 class="font-semibold text-gray-900 mb-2">Email</h3>
          <p class="text-gray-600">ayuda@cooperativa.com</p>
          <p class="text-sm text-gray-500">Respuesta en 24 horas</p>
        </div>
        
        <div class="text-center">
          <MapPin class="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 class="font-semibold text-gray-900 mb-2">Oficina</h3>
          <p class="text-gray-600">Av. Principal 123</p>
          <p class="text-sm text-gray-500">Ciudad, Estado</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BookOpen, HelpCircle, Phone, Mail, MapPin } from 'lucide-vue-next'

useHead({
  title: 'Centro de Ayuda - Cooperativa',
  meta: [
    { name: 'description', content: 'Centro de ayuda para socios de la cooperativa. Guías, preguntas frecuentes y contacto.' }
  ]
})
</script>
