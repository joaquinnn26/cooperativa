import { isMeterAvailable } from './meterWorkflow.js'
function reading(value, label) {
  if (String(value ?? '').trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) throw new Error(`Ingresá una ${label} válida, igual o mayor que cero.`)
  return Number(value)
}
export function meterWorkPayload({ mode, type, meter, nuevo, lectura, final, condition, detalle, anterior, retirar }) {
  if ((retirar || anterior) && !['Operativo', 'PendienteRevision', 'Averiado'].includes(condition)) throw new Error('Indicá la condición del medidor retirado.')
  if (retirar) {
    if (!anterior) throw new Error('Falta identificar el medidor que se retira.')
    return { Accion: 'Retirar', Version: anterior.Version, Lectura: reading(final, 'lectura final'), EstadoFisico: condition, Detalle: detalle }
  }
  if (!type?.idTipoMedidor) throw new Error('No se pudo determinar el tipo de medidor del servicio.')
  let selected
  if (mode === 'nuevo') {
    const number = nuevo.Numero.trim()
    if (!number || number.length > 50) throw new Error('Ingresá el número que figura en el medidor, de hasta 50 caracteres.')
    selected = { NuevoMedidor: { Numero: number, Marca: nuevo.Marca.trim(), Modelo: nuevo.Modelo.trim(), idTipoMedidor: type.idTipoMedidor } }
  } else if (mode === 'disponible') {
    if (!isMeterAvailable(meter)) throw new Error('Seleccioná un medidor disponible y operativo.')
    if (Number(meter.idTipoMedidor) !== Number(type.idTipoMedidor)) throw new Error('El medidor seleccionado no corresponde a este servicio.')
    if (anterior && Number(meter.idMedidor) === Number(anterior.idMedidor)) throw new Error('Elegí un equipo diferente al medidor que retirás.')
    selected = { idMedidor: meter.idMedidor, Version: meter.Version }
  } else throw new Error('Elegí cómo identificar el medidor instalado.')
  return { ...selected, Lectura: reading(lectura, 'lectura inicial'), Detalle: detalle,
    ...(anterior ? { VersionAnterior: anterior.Version, LecturaFinal: reading(final, 'lectura final'), EstadoRetirado: condition } : {}) }
}
