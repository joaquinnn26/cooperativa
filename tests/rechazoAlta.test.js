import test from 'node:test'
import assert from 'node:assert/strict'
import { motivosRechazoAlta, validarRechazoAlta } from '../src/utils/rechazoAlta.js'

test('rechazo exige un motivo de la lista', () => {
  assert.ok(validarRechazoAlta('', 'Una explicación'))
  assert.ok(validarRechazoAlta('Inventado'))
  for (const motivo of motivosRechazoAlta.filter(m => m !== 'Otro')) {
    assert.equal(validarRechazoAlta(motivo), '')
    assert.equal(validarRechazoAlta(motivo, 'Detalle opcional'), '')
  }
})
test('Otro exige una explicación no vacía', () => {
  assert.ok(validarRechazoAlta('Otro'))
  assert.ok(validarRechazoAlta('Otro', '   '))
  assert.equal(validarRechazoAlta('Otro', 'Se necesita una aclaración.'), '')
})
test('la observación admite hasta 1000 caracteres', () => {
  assert.equal(validarRechazoAlta('Otro', 'a'.repeat(1000)), '')
  assert.ok(validarRechazoAlta('Documento ilegible', 'a'.repeat(1001)))
})
