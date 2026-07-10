import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanText,
  isMeaningfulText,
  isPositiveNumber,
  isTodayOrPast,
  isStrongPassword,
  isTodayOrFuture,
  isValidDocument,
  isValidEmail,
  isValidPersonName,
  isValidServiceName
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

test('rechaza nombres de servicio puramente numericos', () => {
  assert.equal(isValidServiceName('Agua potable'), true)
  assert.equal(isValidServiceName('12345'), false)
})

test('rechaza textos descriptivos sin letras', () => {
  assert.equal(isMeaningfulText('Factura con error', { min: 5 }), true)
  assert.equal(isMeaningfulText('123456', { min: 5 }), false)
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

function toLocalDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test('rechaza fechas anteriores al dia actual', () => {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  assert.equal(isTodayOrFuture(toLocalDateInput(today)), true)
  assert.equal(isTodayOrFuture(toLocalDateInput(yesterday)), false)
  assert.equal(isTodayOrFuture(toLocalDateInput(tomorrow)), true)
})

test('rechaza fechas posteriores al dia actual cuando corresponde', () => {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  assert.equal(isTodayOrPast(toLocalDateInput(today)), true)
  assert.equal(isTodayOrPast(toLocalDateInput(tomorrow)), false)
})
