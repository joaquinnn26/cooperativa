export const estadosAlta = { PendienteDocumentacion: 'Pendiente de documentación', EnRevision: 'En revisión', Rechazada: 'Rechazada', Aprobada: 'Aprobada' }
export const requisitosAlta = [
  { tipo: 'Domicilio', nombre: 'Constancia de domicilio' },
  { tipo: 'DniFrente', nombre: 'DNI frente' },
  { tipo: 'DniDorso', nombre: 'DNI dorso' }
]
export function puedeEnviarAlta(alta, documentos) {
  return requisitosAlta.every(({ tipo }) => {
    const latest = documentos.find(d => d.Tipo === tipo)
    return latest && latest.Estado !== 'Rechazado'
  }) && ['PendienteDocumentacion', 'Rechazada'].includes(alta?.Estado)
}
