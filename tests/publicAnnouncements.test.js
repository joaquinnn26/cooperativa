import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchPublicAnnouncements } from '../src/features/home/publicAnnouncements.js'

test('la consulta pública conserva el orden del backend y descarta datos administrativos', async () => {
  const source = [
    { idAnuncio: 9, Titulo: 'Fijado', Contenido: 'Completo', FechaPublicacion: '2026-10-10T12:00:00', Prioridad: 'Baja', Fijo: true, idEmpleado: 33 },
    { idAnuncio: 2, Titulo: 'Alta', Contenido: 'Otro', Prioridad: 'Alta', Fijo: false, Empleado: { Documento: 'privado' } }
  ]
  let request
  const items = await fetchPublicAnnouncements('/api/anuncios', { fetchImpl: async (url, options) => {
    request = { url, options }
    return { ok: true, json: async () => source }
  } })
  assert.deepEqual(items.map(x => x.id), [9, 2])
  assert.equal(items[0].content, 'Completo')
  assert.equal(items[0].fixed, true)
  assert.equal(items[1].priority, 'high')
  assert.equal('idEmpleado' in items[0], false)
  assert.equal('Empleado' in items[1], false)
  assert.equal(request.url, '/api/anuncios')
  assert.equal(request.options.credentials, 'omit')
  assert.equal(request.options.cache, 'no-store')
  assert.equal(request.options.headers, undefined)
})

test('un resultado vacío permanece vacío, sin ejemplos', async () => {
  assert.deepEqual(await fetchPublicAnnouncements('/api/anuncios', { fetchImpl: async () => ({ ok: true, json: async () => [] }) }), [])
})

test('los errores HTTP y de red se propagan sin recurrir a datos guardados', async () => {
  await assert.rejects(fetchPublicAnnouncements('/api/anuncios', { fetchImpl: async () => ({ ok: false, status: 500 }) }), /No se pudieron cargar/)
  await assert.rejects(fetchPublicAnnouncements('/api/anuncios', { fetchImpl: async () => { throw new Error('sin conexión') } }), /sin conexión/)
})

test('una respuesta inesperada no se interpreta como ausencia de anuncios', async () => {
  await assert.rejects(fetchPublicAnnouncements('/api/anuncios', { fetchImpl: async () => ({ ok: true, json: async () => ({ Message: 'error' }) }) }), /no es válida/)
})
