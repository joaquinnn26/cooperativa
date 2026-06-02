import React, { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Droplet,
  FilePlus2,
  Gauge,
  Menu,
  Megaphone,
  Receipt,
  Settings,
  UserCircle2,
  Users,
  Wrench,
  X,
  Zap
} from 'lucide-react'
import useAuthStore from '../store/authStore.js'
import AuthSessionManager from './AuthSessionManager.jsx'
import NotificationStack from './NotificationStack.jsx'
import { getDefaultRouteByRole, normalizeCargo, normalizeRole } from '@/utils/auth.js'

function buildPanelSections(role, cargo) {
  const normalizedRole = normalizeRole(role)
  const normalizedCargo = normalizeCargo(cargo)

  if (normalizedRole === 'Administrador') {
    return [
      {
        title: 'General',
        items: [
          { to: '/admin', label: 'Panel principal', icon: Bell },
          { to: '/admin/socios', label: 'Socios', icon: Users },
          { to: '/admin/empleados', label: 'Empleados', icon: Users }
        ]
      },
      {
        title: 'Servicios',
        items: [
          { to: '/admin/servicios', label: 'Servicios', icon: Settings },
          { to: '/admin/medidores', label: 'Medidores', icon: Zap },
          { to: '/admin/lecturas', label: 'Lecturas', icon: Gauge },
          { to: '/admin/solicitudes-servicio', label: 'Solicitudes', icon: ClipboardList },
          { to: '/admin/requisitos-servicio', label: 'Requisitos', icon: FilePlus2 }
        ]
      },
      {
        title: 'Gestion',
        items: [
          { to: '/admin/facturas', label: 'Facturas', icon: Receipt },
          { to: '/admin/anuncios', label: 'Anuncios', icon: Megaphone },
          { to: '/admin/reclamos', label: 'Reclamos', icon: AlertTriangle }
        ]
      }
    ]
  }

  if (normalizedRole === 'Empleado') {
    return [
      {
        title: 'Trabajo',
        items: [
          { to: '/empleado', label: 'Panel principal', icon: Bell },
          ...(normalizedCargo.includes('lecturista')
            ? [{ to: '/empleado/mediciones', label: 'Mediciones', icon: Gauge }]
            : []),
          ...(normalizedCargo.includes('tecnico')
            ? [{ to: '/empleado/solicitudes-tecnicas', label: 'Solicitudes tecnicas', icon: Wrench }]
            : [])
        ]
      }
    ]
  }

  return [
    {
      title: 'Mi cuenta',
      items: [
        { to: '/socio', label: 'Panel principal', icon: Bell },
        { to: '/facturas', label: 'Mis facturas', icon: Receipt },
        { to: '/socio/perfil', label: 'Mi perfil', icon: UserCircle2 },
        { to: '/socio/mis-servicios', label: 'Mis servicios', icon: Settings },
        { to: '/socio/mis-mediciones', label: 'Mis mediciones', icon: Gauge }
      ]
    },
    {
      title: 'Tramites',
      items: [
        { to: '/socio/solicitudes-servicio', label: 'Solicitudes', icon: ClipboardList },
        { to: '/socio/solicitudes-servicio/nueva', label: 'Nuevo servicio', icon: FilePlus2 },
        { to: '/socio/reclamos', label: 'Mis reclamos', icon: AlertTriangle },
        { to: '/socio/reclamos/nuevo', label: 'Nuevo reclamo', icon: AlertTriangle }
      ]
    }
  ]
}

function findCurrentLabel(sections, pathname) {
  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        return item.label
      }
    }
  }
  return 'Panel'
}

export default function Layout() {
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const cargo = useAuthStore((state) => state.cargo)
  const logout = useAuthStore((state) => state.logout)
  const rol = useAuthStore((state) => state.rol)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const normalizedRole = normalizeRole(rol)
  const panelPath = getDefaultRouteByRole(normalizedRole)
  const isPanelRoute =
    /^\/(admin|socio|empleado)(\/|$)/.test(location.pathname) ||
    (normalizedRole === 'Socio' && location.pathname === '/facturas')
  const sections = useMemo(() => buildPanelSections(normalizedRole, cargo), [normalizedRole, cargo])
  const currentLabel = useMemo(() => findCurrentLabel(sections, location.pathname), [sections, location.pathname])

  const displayRole =
    normalizedRole === 'Administrador' ? 'Administrador' : normalizedRole === 'Empleado' ? 'Empleado' : 'Socio'

  const publicLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/facturas', label: 'Facturas' },
    { to: '/ayuda', label: 'Ayuda' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthSessionManager />

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {usuario && isPanelRoute ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              ) : null}

              <Link to={usuario ? panelPath : '/'} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Cooperativa</h1>
                  <p className="text-sm text-gray-600">Agua y Luz</p>
                </div>
              </Link>
            </div>

            {!usuario ? (
              <nav className="hidden md:flex space-x-8">
                {publicLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors',
                        isActive ? 'text-blue-600 bg-blue-50' : ''
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            ) : isPanelRoute ? (
              <div className="hidden md:block">
                <span className="text-sm font-medium text-gray-500">{displayRole} / </span>
                <span className="text-sm font-semibold text-gray-900">{currentLabel}</span>
              </div>
            ) : null}

            <div className="flex items-center space-x-3">
              {usuario ? (
                <>
                  <Link
                    to={panelPath}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Mi panel
                  </Link>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{nombre || usuario}</p>
                    <p className="text-xs text-gray-600">
                      {displayRole}
                      {cargo ? ` • ${cargo}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-primary text-sm">
                  Iniciar sesion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {usuario && isPanelRoute ? (
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] py-6">
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-4 overflow-y-auto pr-2">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <p className="text-sm text-gray-500">Sesion activa</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{nombre || usuario}</p>
                  <p className="text-sm text-gray-600">
                    {displayRole}
                    {cargo ? ` • ${cargo}` : ''}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 space-y-4">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon
                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                [
                                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                ].join(' ')
                              }
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </NavLink>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <main className="min-w-0">
              <Outlet />
            </main>
          </div>
        ) : (
          <main>
            <Outlet />
          </main>
        )}
      </div>

      {usuario && isPanelRoute && menuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="h-full w-[88%] max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div>
                <p className="text-sm text-gray-500">{displayRole}</p>
                <p className="text-lg font-semibold text-gray-900">{nombre || usuario}</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-5.5rem)] overflow-y-auto p-4 space-y-4">
              <Link
                to={panelPath}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-700"
              >
                <span className="font-semibold">Ir a mi panel</span>
                <Bell className="w-4 h-4" />
              </Link>

              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className={({ isActive }) =>
                            [
                              'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                              isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            ].join(' ')
                          }
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={logout}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                <p>Sabados: 8:00 - 12:00</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces utiles</h3>
              <div className="space-y-2">
                <Link to="/ayuda" className="block text-gray-300 hover:text-white transition-colors">
                  Ayuda
                </Link>
                <Link to="/contacto" className="block text-gray-300 hover:text-white transition-colors">
                  Contacto
                </Link>
                <Link to="/terminos" className="block text-gray-300 hover:text-white transition-colors">
                  Terminos y Condiciones
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
