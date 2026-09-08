import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isInternetService,
  serviceRequiresInstallation,
  serviceRequiresMeter
} from '../src/utils/serviceInstallation.js'

test('internet requiere instalacion pero no medidor ni consumo', () => {
  assert.equal(isInternetService('Internet fibra'), true)
  assert.equal(serviceRequiresInstallation('Internet fibra'), true)
  assert.equal(serviceRequiresMeter('Internet fibra'), false)
})

test('agua y luz requieren instalacion con medidor', () => {
  assert.equal(serviceRequiresInstallation('Agua potable'), true)
  assert.equal(serviceRequiresMeter('Agua potable'), true)
  assert.equal(serviceRequiresInstallation('Luz'), true)
  assert.equal(serviceRequiresMeter('Luz'), true)
})
