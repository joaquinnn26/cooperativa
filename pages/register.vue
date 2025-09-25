<template>
  <div class="max-w-md mx-auto">
    <div class="card">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Registrarse</h1>
        <p class="text-gray-600">Crea tu cuenta de socio</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              required
              class="input-field"
              placeholder="Juan"
            />
          </div>
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
              Apellido
            </label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              required
              class="input-field"
              placeholder="Pérez"
            />
          </div>
        </div>

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
            placeholder="juan@email.com"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            required
            class="input-field"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label for="address" class="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <textarea
            id="address"
            v-model="form.address"
            required
            rows="3"
            class="input-field"
            placeholder="Calle 123, Ciudad, Estado"
          ></textarea>
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
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Contraseña
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            class="input-field"
            placeholder="Repite tu contraseña"
          />
        </div>

        <div class="flex items-center">
          <input
            id="terms"
            v-model="form.acceptTerms"
            type="checkbox"
            required
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="terms" class="ml-2 block text-sm text-gray-700">
            Acepto los 
            <NuxtLink to="/terminos" class="text-blue-600 hover:text-blue-500">
              términos y condiciones
            </NuxtLink>
          </label>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading">Creando cuenta...</span>
          <span v-else>Crear Cuenta</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          ¿Ya tienes cuenta?
          <NuxtLink 
            to="/login" 
            class="text-blue-600 hover:text-blue-500 font-medium"
          >
            Inicia sesión aquí
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UserPlus } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const appStore = useAppStore()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const isLoading = ref(false)

const isFormValid = computed(() => {
  return form.value.firstName && 
         form.value.lastName && 
         form.value.email && 
         form.value.phone && 
         form.value.address && 
         form.value.password && 
         form.value.confirmPassword && 
         form.value.acceptTerms &&
         form.value.password === form.value.confirmPassword
})

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    appStore.addNotification({
      title: 'Error',
      message: 'Las contraseñas no coinciden',
      type: 'error'
    })
    return
  }

  isLoading.value = true
  
  try {
    const userData = {
      name: `${form.value.firstName} ${form.value.lastName}`,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      password: form.value.password,
      type: 'socio'
    }
    
    await authStore.register(userData)
    appStore.addNotification({
      title: '¡Bienvenido!',
      message: 'Tu cuenta ha sido creada exitosamente',
      type: 'success'
    })
    
    await navigateTo('/socio')
  } catch (error) {
    appStore.addNotification({
      title: 'Error',
      message: 'No se pudo crear la cuenta',
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>
