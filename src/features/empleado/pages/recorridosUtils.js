export const routeText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export function localRouteDate() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function routeNumbers(route) {
  const items = route.items || [], measured = items.filter(item => item.estado === 'Medido').length
  const incidents = items.filter(item => ['NoAcceso', 'MedidorDanado', 'Observado'].includes(item.estado)).length
  return { total: items.length, measured, incidents, percent: items.length ? Math.round(measured / items.length * 100) : 0 }
}
export function routeDateLabel(value) { return value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR') : 'Sin fecha' }
export const routeItemState = value => ({Medido:'Lectura registrada', NoAcceso:'Sin acceso', MedidorDanado:'Medidor dañado', Observado:'Con observación', Pendiente:'Pendiente'})[value] || value
