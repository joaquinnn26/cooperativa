import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedMeterActions, meterStatus, isMeterAvailable, compatibleMeterType } from '../src/utils/meterWorkflow.js'
const available = { IdentidadVerificada: true, EstadoFisico: 'Operativo', idAsignacion: null }
test('el inventario separa equipos disponibles, instalados y no utilizables', () => {
  assert.equal(meterStatus(available), 'Disponible')
  assert.equal(isMeterAvailable(available), true)
  for (const m of [{ ...available, idAsignacion: 4 }, { ...available, IdentidadVerificada: false }, { ...available, EstadoFisico: 'Averiado' }, { ...available, EstadoFisico: 'BajaDefinitiva' }]) assert.equal(isMeterAvailable(m), false)
})
test('las acciones del inventario no mezclan trabajos de instalación', () => {
  for (const m of [available, { ...available, idAsignacion: 4 }]) {
    const actions = allowedMeterActions(m, true)
    assert.equal(actions.includes('Instalar') || actions.includes('Retirar') || actions.includes('Reemplazar'), false)
  }
  assert.equal(allowedMeterActions({ ...available, idAsignacion: 4 }, true).includes('BajaDefinitiva'), false)
  assert.equal(allowedMeterActions(available, false).includes('Editar'), false)
  assert.deepEqual(allowedMeterActions({ ...available, EstadoFisico: 'BajaDefinitiva' }, true), [])
})
test('selección de equipos compatible con el servicio', () => {
  assert.equal(compatibleMeterType('Agua potable', 'Agua'), true)
  assert.equal(compatibleMeterType('Energía eléctrica', 'Eléctrico'), true)
  assert.equal(compatibleMeterType('Luz', 'Electrico'), true)
  assert.equal(compatibleMeterType('Agua potable', 'Eléctrico'), false)
  assert.equal(compatibleMeterType('Internet', 'Agua'), false)
})
