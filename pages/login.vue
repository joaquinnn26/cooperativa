<template>
  <div class="max-w-md mx-auto">
    <div class="card">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
        <p class="text-gray-600">Accede a tu cuenta de socio</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="input-field"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="input-field"
            placeholder="Tu contraseña"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-700">
              Recordarme
            </label>
          </div>
          <NuxtLink 
            to="/forgot-password" 
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            ¿Olvidaste tu contraseña?
          </NuxtLink>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading">Iniciando sesión...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          ¿No tienes cuenta?
          <NuxtLink 
            to="/register" 
            class="text-blue-600 hover:text-blue-500 font-medium"
          >
            Regístrate aquí
          </NuxtLink>
        </p>
      </div>

      <!-- Demo Users -->
      <div class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Usuarios de Prueba:</h3>
        <div class="space-y-2 text-sm">
          <button 
            @click="loginAsDemo('socio')"
            class="w-full text-left p-2 bg-white rounded border hover:bg-gray-50"
          >
            <strong>Socio:</strong> socio@demo.com / 123456
          </button>
          <button 
            @click="loginAsDemo('admin')"
            class="w-full text-left p-2 bg-white rounded border hover:bg-gray-50"
          >
            <strong>Admin:</strong> admin@demo.com / 123456
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { LogIn } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const appStore = useAppStore()

const form = ref({
  email: '',
  password: '',
  remember: false
})

const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  
  try {
    await authStore.login(form.value)
    appStore.addNotification({
      title: '¡Bienvenido!',
      message: 'Has iniciado sesión correctamente',
      type: 'success'
    })
    
    // Redirigir según el tipo de usuario
    const redirectPath = authStore.userType === 'admin' ? '/admin' : '/socio'
    await navigateTo(redirectPath)
  } catch (error) {
    appStore.addNotification({
      title: 'Error',
      message: 'Credenciales incorrectas',
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const loginAsDemo = async (type) => {
  const credentials = type === 'admin' 
    ? { email: 'admin@demo.com', password: '123456' }
    : { email: 'socio@demo.com', password: '123456' }
  
  form.value = { ...credentials, remember: false }
  await handleLogin()
}
</script>
