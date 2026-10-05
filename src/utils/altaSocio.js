import { rolesMatch } from './auth.js'

export const estadosAlta = { PendienteDocumentacion: 'Pendiente de documentación', EnRevision: 'En revisión', Rechazada: 'Rechazada', Aprobada: 'Aprobada' }
export const requisitosAlta = [
  { tipo: 'Domicilio', nombre: 'Constancia de domicilio' },
  { tipo: 'DniFrente', nombre: 'DNI frente' },
  { tipo: 'DniDorso', nombre: 'DNI dorso' }
]
export function documentosAltaCompletos(documentos = []) {
  return requisitosAlta.every(({ tipo }) => {
    const latest = documentos.find(d => d.Tipo === tipo)
    return latest && latest.Estado !== 'Rechazado'
  })
}

export function puedeEnviarAlta(alta, documentos) {
  return ['PendienteDocumentacion', 'Rechazada'].includes(alta?.Estado) && documentosAltaCompletos(documentos)
}

export function tieneAltaPendiente(rol, alta) {
  return rolesMatch(rol, 'Socio') && alta != null && alta.Estado !== 'Aprobada'
}
