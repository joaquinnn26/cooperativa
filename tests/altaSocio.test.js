import test from 'node:test'
import assert from 'node:assert/strict'
import { puedeEnviarAlta } from '../src/utils/altaSocio.js'

const required = ['Domicilio', 'DniFrente', 'DniDorso']
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
