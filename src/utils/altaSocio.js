export const requisitosAlta = [
  { tipo: 'Domicilio', nombre: 'Constancia de domicilio' },
  { tipo: 'DniFrente', nombre: 'DNI — frente' },
  { tipo: 'DniDorso', nombre: 'DNI — dorso' }
]

export const estadosAlta = {
  PendienteDocumentacion: 'Documentación pendiente',
  EnRevision: 'En revisión por Administración',
  Rechazada: 'Documentación rechazada',
  Aprobada: 'Alta aprobada'
}

export function tieneAltaPendiente(rol, alta) {
  return rol === 'Socio' && alta != null && alta.Estado !== 'Aprobada'
}

export function puedeEnviarAlta(alta, documentos) {
  return ['PendienteDocumentacion', 'Rechazada'].includes(alta?.Estado) &&
    requisitosAlta.every(requisito => documentos.some(doc => doc.Tipo === requisito.tipo))
}
