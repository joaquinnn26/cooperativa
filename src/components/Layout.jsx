import React, { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BarChart3,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  MapPinned,
  FilePlus2,
  Gauge,
  Headphones,
  Menu,
  Megaphone,
  Receipt,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  Wrench,
  X,
  Zap
} from 'lucide-react'
import cospralLogo from '@/assets/cospral-wordmark.png'
import useAuthStore from '../store/authStore.js'
import AuthSessionManager from './AuthSessionManager.jsx'
import PublicAnnouncementsBanner from './PublicAnnouncementsBanner.jsx'
import PublicFooter from '@/features/home/PublicFooter.jsx'
import '@/features/home/Home.css'
import { getDefaultRouteByRole, normalizeCargo, normalizeRole } from '@/utils/auth.js'
import { rutasLaborales } from '@/utils/laboralPermissions.js'

const employeeIconByPath = {
  '/empleado/anuncios': Megaphone,
  '/empleado/cobranzas': CreditCard,
  '/empleado/documentacion': FileText,
  '/empleado/facturas': Receipt,
  '/empleado/hoja-ruta': MapPinned,
  '/empleado/incidencias': AlertTriangle,
  '/empleado/indicadores': BarChart3,
  '/empleado/instalaciones': Wrench,
  '/empleado/mediciones': Gauge,
  '/empleado/medidores': Gauge,
  '/empleado/operaciones': Settings,
  '/empleado/pagos': Receipt,
  '/empleado/reclamos': AlertTriangle,
  '/empleado/reportes': BarChart3,
  '/empleado/rutas-medicion': MapPinned,
  '/empleado/servicios': Settings,
  '/empleado/solicitudes-servicio': ClipboardList,
  '/empleado/solicitudes-tecnicas': Wrench,
  '/empleado/soporte': Headphones,
  '/empleado/supervision': ShieldCheck,
  '/empleado/turnos': CalendarClock,
  '/empleado/usuarios': Users
}

function buildPanelSections(role, areas) {
  const normalizedRole = normalizeRole(role)
  const trabajo = { title: 'Mi trabajo', items: [{ to: '/empleado', label: 'Panel laboral', icon: Bell }, ...rutasLaborales(areas).map(r => ({ ...r, icon: employeeIconByPath[r.to] || ClipboardList })), { to: '/empleado/estadisticas-eventos', label: 'Estadísticas e historial', icon: BarChart3 }] }
  if (normalizedRole === 'Administrador') return [
    { title: 'Administración del sistema', items: [
      { to: '/admin', label: 'Panel principal', icon: Bell },
      { to: '/admin/organizacion', label: 'Áreas, funciones y encargados', icon: Users },
      { to: '/admin/empleados', label: 'Empleados y acceso laboral', icon: Users },
      { to: '/admin/legajos', label: 'Legajos de personas', icon: FileText },
      { to: '/admin/altas-socio', label: 'Altas de socios', icon: ShieldCheck },
      { to: '/admin/socios', label: 'Socios', icon: Users },
      { to: '/admin/servicios', label: 'Servicios', icon: Settings },
      { to: '/admin/medidores', label: 'Inventario de medidores', icon: Gauge },
      { to: '/admin/territorio', label: 'Conexiones y territorio', icon: MapPinned },
      { to: '/admin/requisitos-servicio', label: 'Requisitos de servicios', icon: FilePlus2 },
      { to: '/admin/anuncios', label: 'Anuncios', icon: Megaphone },
      { to: '/admin/estadisticas-eventos', label: 'Estadísticas e historial', icon: BarChart3 }
    ] }, ...(areas.length ? [trabajo] : [])]
  if (normalizedRole === 'Empleado') return [
    { title: 'Mi cuenta', items: [{ to: '/empleado/legajo', label: 'Mi legajo', icon: FileText }] },
    trabajo
  ]
  return [{ title: 'Mi cuenta', items: [
    { to: '/socio', label: 'Panel principal', icon: Bell },
    { to: '/facturas', label: 'Mis facturas', icon: Receipt },
    { to: '/socio/perfil', label: 'Mi perfil', icon: UserCircle2 },
    { to: '/socio/documentos', label: 'Mi documentación', icon: FileText },
    { to: '/socio/mis-servicios', label: 'Mis servicios', icon: Settings },
    { to: '/socio/mis-mediciones', label: 'Mis mediciones', icon: Gauge }
  ] }, { title: 'Trámites', items: [
    { to: '/socio/solicitudes-servicio', label: 'Solicitudes de servicio', icon: ClipboardList },
    { to: '/socio/solicitudes-servicio/nueva', label: 'Nuevo servicio', icon: FilePlus2 },
    { to: '/socio/reclamos', label: 'Mis reclamos', icon: AlertTriangle },
    { to: '/socio/reclamos/nuevo', label: 'Nuevo reclamo', icon: AlertTriangle },
    { to: '/socio/turnos', label: 'Mis turnos', icon: CalendarClock }
  ] }]
}

function findCurrentLabel(sections, pathname) {
  let bestMatch = null

  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        if (!bestMatch || item.to.length > bestMatch.to.length) {
          bestMatch = item
        }
      }
    }
  }

  return bestMatch?.label || 'Panel'
}

export default function Layout() {
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const cargo = useAuthStore((state) => state.cargo)
  const areas = useAuthStore(state => state.areas)
  const logout = useAuthStore((state) => state.logout)
  const rol = useAuthStore((state) => state.rol)
  const location = useLocation()
  const isLoginRoute = location.pathname === '/login'
  const isHomeRoute = location.pathname === '/'
  const isInstitutionalPublic = !usuario && !isLoginRoute
  const [menuOpen, setMenuOpen] = useState(false)

  const normalizedRole = normalizeRole(rol)
  const panelPath = getDefaultRouteByRole(normalizedRole)
  const isPanelRoute =
    /^\/(admin|socio|empleado)(\/|$)/.test(location.pathname) ||
    (normalizedRole === 'Socio' && location.pathname === '/facturas')
  const showBackToPanel =
    usuario &&
    ['Administrador', 'Socio'].includes(normalizedRole) &&
    isPanelRoute &&
    location.pathname !== panelPath
  const sections = useMemo(() => buildPanelSections(normalizedRole, areas), [normalizedRole, areas])
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
      {!usuario && !isHomeRoute ? <PublicAnnouncementsBanner /> : null}

      <header className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 ${isInstitutionalPublic ? 'public-site-header' : ''}`}>
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

              <Link to={isHomeRoute ? '/' : usuario ? panelPath : '/'} className="flex items-center space-x-3">
                <img src={cospralLogo} alt="COSPRAL · Cooperativa de Agua y Luz" className="public-header-logo h-10 w-[150px] object-contain object-left sm:w-[175px]" />
              </Link>
            </div>

            {!usuario ? (
              <nav aria-label="Navegación principal" className={isInstitutionalPublic ? 'public-nav' : 'hidden md:flex space-x-8'}>
                {(isInstitutionalPublic ? publicLinks.filter(item => ['/', '/ayuda'].includes(item.to)) : publicLinks).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => isInstitutionalPublic ? `public-nav-link ${isActive ? 'active' : ''}` :
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

            <div className="public-header-actions flex items-center space-x-3">
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
                <Link to="/login" className={isInstitutionalPublic ? 'public-login-button' : 'btn-primary text-sm'}>
                  Iniciar sesion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={isLoginRoute || isHomeRoute ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
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
              {showBackToPanel ? (
                <Link
                  to={panelPath}
                  className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Link>
              ) : null}
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

      {isInstitutionalPublic || isHomeRoute ? <PublicFooter /> : <footer className={`bg-gray-800 text-white ${isLoginRoute ? '' : 'mt-16'}`}>
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
            <p>&copy; 2024 COSPRAL · Cooperativa de Agua y Luz. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>}
    </div>
  )
}
