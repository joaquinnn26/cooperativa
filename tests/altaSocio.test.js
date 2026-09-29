import test from 'node:test'
import assert from 'node:assert/strict'
import { tieneAltaPendiente, puedeEnviarAlta } from '../src/utils/altaSocio.js'

test('el socio pendiente o rechazado no puede entrar al panel completo', () => {
  for (const Estado of ['PendienteDocumentacion', 'EnRevision', 'Rechazada']) {
    assert.equal(tieneAltaPendiente('Socio', { Estado }), true)
  }
})
test('la aprobación habilita el panel y conserva el acceso de socios anteriores y otros roles', () => {
  assert.equal(tieneAltaPendiente('Socio', { Estado: 'Aprobada' }), false)
  assert.equal(tieneAltaPendiente('Socio', null), false)
  assert.equal(tieneAltaPendiente('Administrador', { Estado: 'Rechazada' }), false)
  assert.equal(tieneAltaPendiente('Empleado', null), false)
})
test('se exigen los tres requisitos distintos para enviar o reenviar', () => {
  const documentos = ['Domicilio', 'DniFrente', 'DniDorso'].map(Tipo => ({ Tipo }))
  assert.equal(puedeEnviarAlta({ Estado: 'PendienteDocumentacion' }, documentos), true)
  assert.equal(puedeEnviarAlta({ Estado: 'Rechazada' }, documentos), true)
  assert.equal(puedeEnviarAlta({ Estado: 'EnRevision' }, documentos), false)
  assert.equal(puedeEnviarAlta({ Estado: 'Aprobada' }, documentos), false)
  assert.equal(puedeEnviarAlta({ Estado: 'Rechazada' }, documentos.slice(0, 2)), false)
  assert.equal(puedeEnviarAlta({ Estado: 'Rechazada' }, [documentos[0], documentos[0], documentos[1]]), false)
})
