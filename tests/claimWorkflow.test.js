import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllowedClaimStatuses,
  getClaimStatusId,
  isValidClaimTransition,
  normalizeClaimStatus
} from '../src/utils/claimWorkflow.js'

test('normaliza los cuatro estados funcionales de reclamos', () => {
  assert.equal(normalizeClaimStatus('EN PROCESO'), 'En proceso')
  assert.equal(normalizeClaimStatus('Cancelada'), 'Cancelado')
  assert.equal(getClaimStatusId('Resuelto'), 3)
})

test('solo habilita transiciones validas de reclamos', () => {
  assert.deepEqual(getAllowedClaimStatuses('Pendiente'), ['Pendiente', 'En proceso', 'Cancelado'])
  assert.equal(isValidClaimTransition('Pendiente', 'Resuelto'), false)
  assert.equal(isValidClaimTransition('En proceso', 'Resuelto'), true)
  assert.equal(isValidClaimTransition('Resuelto', 'Pendiente'), false)
})
