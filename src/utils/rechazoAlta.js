export const motivosRechazoAlta = [
  'Documento ilegible',
  'Documento vencido',
  'DNI frente incorrecto',
  'DNI dorso incorrecto',
  'Constancia de domicilio incorrecta',
  'Datos no coinciden con la documentación',
  'Falta documentación',
  'Documentación incompleta',
  'Otro'
]

export function validarRechazoAlta(motivo, observacion = '') {
  if (!motivosRechazoAlta.includes(motivo)) return 'Seleccioná un motivo del rechazo.'
  if (motivo === 'Otro' && !observacion.trim()) return 'Explicá el motivo en la observación adicional.'
  if (observacion.trim().length > 1000) return 'La observación adicional admite hasta 1000 caracteres.'
  return ''
}
