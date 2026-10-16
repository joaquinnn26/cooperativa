export const meterActions = { Alta: 'Registrar medidor', Verificar: 'Confirmar datos físicos', Editar: 'Modificar datos', Instalar: 'Instalación', Reemplazar: 'Reemplazo', Retirar: 'Retiro', Falla: 'Registrar falla', Reparacion: 'Enviar a reparación', Revision: 'Registrar revisión', BajaDefinitiva: 'Dar de baja definitiva' }
export const physicalStates = { Operativo: 'En buenas condiciones', PendienteRevision: 'Pendiente de revisión', Averiado: 'Averiado', EnReparacion: 'En reparación', BajaDefinitiva: 'Baja definitiva' }
export function meterStatus(meter) {
  if (meter.EstadoFisico === 'BajaDefinitiva') return 'Baja definitiva'
  if (meter.idAsignacion) return 'Instalado'
  if (!meter.IdentidadVerificada) return 'Datos por confirmar'
  if (meter.EstadoFisico === 'Operativo') return 'Disponible'
  return physicalStates[meter.EstadoFisico] || 'Por revisar'
}
export function isMeterAvailable(meter) {
  return Boolean(meter?.IdentidadVerificada && meter.EstadoFisico === 'Operativo' && !meter.idAsignacion)
}
export function allowedMeterActions(meter, admin) {
  if (meter.EstadoFisico === 'BajaDefinitiva') return []
  const actions = []
  if (!meter.IdentidadVerificada) actions.push('Verificar')
  else if (admin) actions.push('Editar')
  if (meter.idAsignacion && (meter.PendienteConciliacion || meter.EstadoFisico === 'Averiado' || meter.EstadoFisico === 'PendienteRevision') && meter.IdentidadVerificada) actions.push('Revision')
  if (!meter.idAsignacion) {
    if (['Averiado', 'PendienteRevision'].includes(meter.EstadoFisico)) actions.push('Reparacion')
    if (meter.IdentidadVerificada) actions.push('Revision')
    if (admin) actions.push('BajaDefinitiva')
  }
  if (meter.IdentidadVerificada && meter.EstadoFisico === 'Operativo') actions.push('Falla')
  return actions
}
export function compatibleMeterType(service, type) {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const s = normalize(service), t = normalize(type)
  return (s.includes('agua') && t === 'agua') || ((s.includes('luz') || s.includes('electric')) && t === 'electrico')
}
