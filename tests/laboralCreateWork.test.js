import test from 'node:test'
import assert from 'node:assert/strict'
import { uniqueActiveConnections, workTaskPayload } from '../src/utils/laboralCreateWork.js'

test('un socio con varios medidores aparece una sola vez por conexión activa', () => {
  const result = uniqueActiveConnections([{ idServicioSocio: 7, Activo: true }, { idServicioSocio: '7', Activo: true }, { idServicioSocio: 8, Activo: false }, { idServicioSocio: 9, Activo: true }])
  assert.equal(result.length, 2)
  assert.deepEqual(result.map(item => Number(item.idServicioSocio)), [7, 9])
})
test('un trabajo interno no arrastra la conexión de una selección anterior', () => {
  assert.deepEqual(workTaskPayload('ENERGIA', ' Revisar el depósito ', 'internal', { idServicioSocio: 7, Activo: true }), { Area: 'ENERGIA', Categoria: 'Trabajo', Titulo: 'Revisar el depósito', idServicioSocio: null })
})
test('el trabajo de un socio exige una conexión activa y envía su identificador', () => {
  assert.throws(() => workTaskPayload('AGUA', 'Revisar pérdida', 'connection', null))
  assert.throws(() => workTaskPayload('AGUA', 'Revisar pérdida', 'connection', { idServicioSocio: 7, Activo: false }))
  assert.equal(workTaskPayload('AGUA', 'Revisar pérdida', 'connection', { idServicioSocio: '7', Activo: true }).idServicioSocio, 7)
})
test('una descripción vacía o demasiado extensa no crea un trabajo', () => {
  assert.throws(() => workTaskPayload('AGUA', '   ', 'internal'))
  assert.throws(() => workTaskPayload('AGUA', 'x'.repeat(201), 'internal'))
})
