<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header simplificado para login -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-center items-center h-16">
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
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { Droplet } from 'lucide-vue-next'
</script>
