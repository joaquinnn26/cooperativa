import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Droplet } from 'lucide-react'
import useAuthStore from '../store/authStore.js'
import AuthSessionManager from './AuthSessionManager.jsx'
import NotificationStack from './NotificationStack.jsx'
import { getDefaultRouteByRole, normalizeRole } from '@/utils/auth.js'

export default function Layout() {
  const usuario = useAuthStore((state) => state.usuario)
  const logout = useAuthStore((state) => state.logout)
  const rol = useAuthStore((state) => state.rol)
  const normalizedRole = normalizeRole(rol)
  const panelPath = getDefaultRouteByRole(normalizedRole)

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthSessionManager />
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Cooperativa</h1>
                  <p className="text-sm text-gray-600">Agua y Luz</p>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  [
                    'text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors',
                    isActive ? 'text-blue-600 bg-blue-50' : ''
                  ].join(' ')
                }
              >
                Inicio
              </NavLink>
              <NavLink
                to="/servicios"
                className={({ isActive }) =>
                  [
                    'text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors',
                    isActive ? 'text-blue-600 bg-blue-50' : ''
                  ].join(' ')
                }
              >
                Servicios
              </NavLink>
              <NavLink
                to="/facturas"
                className={({ isActive }) =>
                  [
                    'text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors',
                    isActive ? 'text-blue-600 bg-blue-50' : ''
                  ].join(' ')
                }
              >
                Facturas
              </NavLink>
              <NavLink
                to="/ayuda"
                className={({ isActive }) =>
                  [
                    'text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors',
                    isActive ? 'text-blue-600 bg-blue-50' : ''
                  ].join(' ')
                }
              >
                Ayuda
              </NavLink>
            </nav>

            <div className="flex items-center space-x-4">
              {usuario ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to={panelPath}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Mi panel
                  </Link>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{usuario}</p>
                    <p className="text-xs text-gray-600">
                      {normalizedRole === 'Administrador'
                        ? 'Administrador'
                        : normalizedRole === 'Empleado'
                          ? 'Empleado'
                          : 'Socio'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-sm">
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="space-y-2 text-gray-300">
                <p>Tel: (555) 123-4567</p>
                <p>Mail: info@cooperativa.com</p>
                <p>Av. Principal 123, Ciudad</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Horarios</h3>
              <div className="space-y-2 text-gray-300">
                <p>Lunes - Viernes: 8:00 - 17:00</p>
                <p>Sábados: 8:00 - 12:00</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces útiles</h3>
              <div className="space-y-2">
                <Link to="/ayuda" className="block text-gray-300 hover:text-white transition-colors">
                  Ayuda
                </Link>
                <Link to="/contacto" className="block text-gray-300 hover:text-white transition-colors">
                  Contacto
                </Link>
                <Link to="/terminos" className="block text-gray-300 hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Cooperativa de Agua y Luz. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <NotificationStack />
    </div>
  )
}
