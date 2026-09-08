import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      cors: true,
      proxy: {
        [env.VITE_API_BASE_PATH || '/api']: {
          target: env.VITE_API_SERVER_URL || 'http://localhost:58234',
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      cors: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            table: ['@tanstack/react-table'],
            ui: ['lucide-react', 'sweetalert2', 'zustand']
          }
        }
      }
    }
  }
})
