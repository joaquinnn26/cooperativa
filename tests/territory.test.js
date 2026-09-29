import test from 'node:test'
import assert from 'node:assert/strict'
import { territoryPayload, territoryRequest } from '../src/utils/territory.js'

test('una ubicación requiere referencia, localidad, ámbito y motivo, no barrio', () => {
  const form = { kind: 'conexiones', Direccion: '  Camino   rural  123 ', Localidad: 'Rancul', Ambito: 'Rural', Ruta: '001', Folio: '0002', idBarrio: '', Motivo: ' Corrección ', Version: 'version' }
  assert.deepEqual(territoryPayload(form), { Direccion: 'Camino rural 123', Localidad: 'Rancul', Ambito: 'Rural', Ruta: '001', Folio: '0002', idBarrio: null, Motivo: 'Corrección', Version: 'version' })
  for (const patch of [{ Direccion: '' }, { Localidad: '' }, { Ambito: '' }, { idBarrio: '1.5' }, { Motivo: '' }, { Folio: '' }]) {
    assert.throws(() => territoryPayload({ ...form, ...patch }))
  }
})

test('una reasignación conserva la versión y no acepta zona inválida', () => {
  const form = { kind: 'barrios', Nombre: ' Barrio  Norte ', idZona: '2', Activo: true, Motivo: 'Reorganización', Version: 'original' }
  assert.equal(territoryPayload(form).Version, 'original')
  assert.equal(territoryPayload(form).idZona, 2)
  assert.throws(() => territoryPayload({ ...form, idZona: '-1' }))
})

test('un conflicto del servidor no se convierte en guardado exitoso', async () => {
  const previous = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(JSON.stringify('El registro cambió.'), { status: 409 })
    await assert.rejects(territoryRequest('/territorio/zonas/1', { token: 'test' }), /El registro cambió/)
    globalThis.fetch = async () => new Response('<html>Error técnico</html>', { status: 500 })
    await assert.rejects(territoryRequest('/territorio/catalogos', { token: 'test' }), /No se pudo consultar/)
  } finally { globalThis.fetch = previous }
})
