import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDefaultRouteByRole,
  hasActiveSession,
  isTokenExpired,
  rolesMatch
} from '../src/utils/auth.js'

function fakeToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${encoded}.signature`
}

test('no considera autenticado a un usuario guardado sin token', () => {
  assert.equal(hasActiveSession({ token: null, usuario: 'admin-falso' }), false)
})

test('rechaza tokens vencidos y acepta tokens con vigencia local', () => {
  const expired = fakeToken({ exp: Math.floor(Date.now() / 1000) - 60 })
  const active = fakeToken({ exp: Math.floor(Date.now() / 1000) + 60 })

  assert.equal(isTokenExpired(expired), true)
  assert.equal(hasActiveSession({ token: active }), true)
})

test('un rol socio no coincide con administrador', () => {
  assert.equal(rolesMatch('Socio', 'Administrador'), false)
  assert.equal(getDefaultRouteByRole('Socio'), '/socio')
})
