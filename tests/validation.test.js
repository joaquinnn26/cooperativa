import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanText,
  isPositiveNumber,
  isStrongPassword,
  isTodayOrFuture,
  isValidDocument,
  isValidEmail,
  isValidPersonName
} from '../src/utils/validation.js'

test('normaliza espacios antes de enviar texto', () => {
  assert.equal(cleanText('  Maria   del   Valle  '), 'Maria del Valle')
})

test('valida correos y documentos del dominio', () => {
  assert.equal(isValidEmail('socio@cooperativa.com'), true)
  assert.equal(isValidEmail('socio@'), false)
  assert.equal(isValidDocument('30111222'), true)
  assert.equal(isValidDocument('30A11222'), false)
})

test('rechaza nombres con numeros', () => {
  assert.equal(isValidPersonName('Ana Maria'), true)
  assert.equal(isValidPersonName('Ana 2'), false)
})

test('exige contrasena fuerte', () => {
  assert.equal(isStrongPassword('Segura#2026'), true)
  assert.equal(isStrongPassword('debil'), false)
})

test('rechaza montos no positivos', () => {
  assert.equal(isPositiveNumber(100), true)
  assert.equal(isPositiveNumber(0), false)
  assert.equal(isPositiveNumber(-1), false)
})

test('rechaza fechas anteriores al dia actual', () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  assert.equal(isTodayOrFuture(yesterday.toISOString().slice(0, 10)), false)
  assert.equal(isTodayOrFuture(tomorrow.toISOString().slice(0, 10)), true)
})
