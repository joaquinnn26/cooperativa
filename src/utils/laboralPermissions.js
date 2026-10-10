export const tieneFuncion = (areas, area, funcion) => (areas || []).some(a => a.Area === area && a.Funciones?.includes(funcion))
export const esEncargado = (areas, area) => (areas || []).some(a => a.Area === area && a.Encargado)
export const puedeVerEstadisticasLaborales = (areas = []) => areas.some(a => a.Encargado) || tieneFuncion(areas, 'GERENCIA', 'CONSULTA_GENERAL')
export function rutasLaborales(areas = []) {
  const routes = areas.map(a => ({ to: `/empleado/areas/${a.Area}`, label: a.Nombre, description: a.Encargado ? 'Equipo, asignaciones y revisión de resultados' : a.Area === 'GAS' ? 'Asignación del área; operaciones por convenio pendientes de definición' : 'Tareas asignadas, resultados e historial', status: 'active' }))
  if (areas.some(a => a.Funciones?.includes('LECTURISTA'))) routes.push({ to: '/empleado/hoja-ruta', label: 'Mis hojas de ruta' })
  if (areas.some(a => ['AGUA', 'ENERGIA'].includes(a.Area) && (a.Encargado || a.Funciones?.includes('OPERARIO')))) routes.push({ to: '/empleado/medidores', label: 'Medidores de mi trabajo' })
  if (areas.some(a => ['AGUA', 'ENERGIA'].includes(a.Area) && a.Encargado)) routes.push({ to: '/empleado/rutas-medicion', label: 'Organizar recorridos' }, { to: '/empleado/mediciones', label: 'Revisión de lecturas' })
  if (tieneFuncion(areas, 'ADMINISTRACION', 'ATENCION') || esEncargado(areas, 'ADMINISTRACION')) routes.push({ to: '/empleado/atencion', label: 'Atención y trámites' })
  if (areas.some(a => a.Funciones?.includes('FACTURACION')) || esEncargado(areas, 'ADMINISTRACION')) routes.push({ to: '/empleado/facturas', label: 'Facturación externa' })
  if (tieneFuncion(areas, 'GERENCIA', 'CONSULTA_GENERAL')) routes.push({ to: '/empleado/reportes', label: 'Actividad de las áreas' })
  return routes
}
export function inicioLaboral(areas = []) {
  if (areas.length === 1 && !tieneFuncion(areas, 'GERENCIA', 'CONSULTA_GENERAL')) return `/empleado/areas/${areas[0].Area}`
  return '/empleado'
}
export function permiteRutaLaboral(areas = [], pathname) {
  if (pathname === '/empleado') return true
  if (!areas?.length) return false
  // El menú expone este historial a cuentas laborales; la API limita los datos
  // a las áreas asignadas y habilita la consulta global para Gerencia.
  if (pathname === '/empleado/estadisticas-eventos') return puedeVerEstadisticasLaborales(areas)
  if (/^\/empleado\/tareas\/\d+$/.test(pathname)) return Boolean(areas?.length)
  return rutasLaborales(areas).some(r => pathname === r.to || pathname.startsWith(`${r.to}/`))
}
export function linkPagoSeguro(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null } catch { return null } }
