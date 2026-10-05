import test from 'node:test'
import assert from 'node:assert/strict'
import { permiteRutaLaboral, rutasLaborales } from '../src/utils/laboralPermissions.js'
import { puedeEnviarAlta, tieneAltaPendiente, documentosAltaCompletos } from '../src/utils/altaSocio.js'

const required = ['Domicilio', 'DniFrente', 'DniDorso']
test('el alta incompleta permanece restringida y normaliza el rol', () => {
  assert.equal(tieneAltaPendiente(' socio ', {}), true)
  assert.equal(tieneAltaPendiente('SOCIO', { Estado: 'Aprobada' }), false)
  assert.equal(tieneAltaPendiente('Empleado', { Estado: 'Rechazada' }), false)
})

test('aprobar y reenviar usan la misma versión documental que se muestra', () => {
  const documentos = required.map(Tipo => ({ Tipo, Estado: 'Pendiente' }))
  assert.equal(documentosAltaCompletos(documentos), true)
  assert.equal(documentosAltaCompletos([{ Tipo: 'Domicilio', Estado: 'Rechazado' }, ...documentos]), false)
  assert.equal(documentosAltaCompletos([documentos[0], documentos[0], documentos[1]]), false)
})

test('estadísticas laborales respetan la función de consulta general en menú y ruta', () => {
  const path = '/empleado/estadisticas-eventos'
  const gerencia = [{ Area: 'GERENCIA', Funciones: ['CONSULTA_GENERAL'] }]
  assert.equal(permiteRutaLaboral(gerencia, path), true)
  assert.equal(rutasLaborales(gerencia).filter(r => r.to === path).length, 1)
  assert.equal(permiteRutaLaboral([], path), false)
  assert.equal(permiteRutaLaboral([{ Area: 'AGUA', Funciones: ['OPERARIO'] }], path), false)
})
const docs = Object.fromEntries(required.map(Tipo => [Tipo, { Tipo, Estado: 'Pendiente' }]))

test('permite enviar el alta cuando están los tres requisitos vigentes', () => {
  assert.equal(puedeEnviarAlta({ Estado: 'PendienteDocumentacion' }, Object.values(docs)), true)
})

test('bloquea el alta si falta un requisito o su versión más reciente fue rechazada', () => {
  assert.equal(puedeEnviarAlta({ Estado: 'Rechazada' }, Object.values(docs).slice(1)), false)
  assert.equal(puedeEnviarAlta({ Estado: 'Rechazada' }, [{ ...docs.Domicilio, Estado: 'Rechazado' }, docs.Domicilio, docs.DniFrente, docs.DniDorso]), false)
})

test('un alta en revisión no se puede volver a enviar', () => {
  assert.equal(puedeEnviarAlta({ Estado: 'EnRevision' }, Object.values(docs)), false)
})

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
