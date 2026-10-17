import test from 'node:test'
import assert from 'node:assert/strict'
import { nuevaAdhesion, validarAdhesion, adhesionPayload, esEnergia, esAdicional } from '../src/utils/adhesiones.js'

const persona = (Documento = '99000001') => ({ Nombre: 'Persona de prueba', Documento, Vinculo: 'Titular', MismoDomicilio: true, archivo: { type: 'application/pdf', size: 120 } })
test('ortopedia se contrata sin familiares ni documentación', async () => {
  const form = { ...nuevaAdhesion(), Ortopedia: true, Consentimiento: true }
  const payload = await adhesionPayload(form, 'Domicilio de prueba', () => { throw new Error('No debe leer DNI') })
  assert.deepEqual(payload.Familiares, [])
  assert.equal(payload.Ortopedia, true)
})
test('sepelio exige DNI, domicilio común y personas sin duplicar', () => {
  const form = { ...nuevaAdhesion(), Sepelio: true, Consentimiento: true, Familiares: [persona()] }
  assert.equal(validarAdhesion(form), true)
  assert.throws(() => validarAdhesion({ ...form, Familiares: [{ ...persona(), archivo: null }] }), /DNI/)
  assert.throws(() => validarAdhesion({ ...form, Familiares: [{ ...persona(), MismoDomicilio: false }] }), /domicilio/)
  assert.throws(() => validarAdhesion({ ...form, Familiares: [persona(), persona()] }), /repetirse/)
})
test('la adhesión es voluntaria y requiere aceptación de los cargos', () => {
  assert.throws(() => validarAdhesion(nuevaAdhesion()), /Elegí/)
  assert.throws(() => validarAdhesion({ ...nuevaAdhesion(), Ortopedia: true }), /cargos/)
})
test('solo sepelio incluye adjuntos en el contrato conjunto', async () => {
  const form = { ...nuevaAdhesion(), Sepelio: true, Ortopedia: true, Consentimiento: true, Familiares: [persona()] }
  const payload = await adhesionPayload(form, ' Calle 1 ', async () => ({ Nombre: 'dni.pdf', Tipo: 'application/pdf', Base64: 'dummy' }))
  assert.equal(payload.Familiares[0].Archivo.Nombre, 'dni.pdf')
  assert.equal(payload.Direccion, 'Calle 1')
  assert.equal(payload.Consentimiento, true)
})
test('los adicionales no se confunden con instalaciones independientes', () => {
  assert.ok(esEnergia('Energía eléctrica'))
  assert.ok(esEnergia('Luz'))
  assert.equal(esEnergia('Internet'), false)
  assert.ok(esAdicional('Ortopedia'))
  assert.ok(esAdicional('Sepelio'))
})
test('se limita el tamaño total de las copias de DNI', () => {
  const Familiares = [1, 2, 3, 4].map(i => ({ ...persona(String(i)), archivo: { type: 'image/png', size: 2 * 1024 * 1024 } }))
  assert.throws(() => validarAdhesion({ Sepelio: true, Consentimiento: true, Familiares }), /6 MB/)
})
test('sepelio permite elegir solo familiares sin obligar al titular ni a todo el grupo', () => {
  assert.equal(validarAdhesion({ Sepelio: true, Consentimiento: true, Familiares: [{ ...persona('99000022'), Vinculo: 'Cónyuge' }] }), true)
})
test('los hijos fuera de la localidad pueden conservar la adhesión con DNI', () => {
  const hijo = { ...persona('99000033'), Vinculo: 'Hija', MismoDomicilio: false, ConservaAdhesion: true }
  assert.equal(validarAdhesion({ Sepelio: true, Consentimiento: true, Familiares: [hijo] }), true)
  assert.throws(() => validarAdhesion({ Sepelio: true, Consentimiento: true, Familiares: [{ ...hijo, Vinculo: 'Primo' }] }), /continuidad/)
  assert.throws(() => validarAdhesion({ Sepelio: true, Consentimiento: true, Familiares: [{ ...hijo, ConservaAdhesion: false }] }), /continuidad/)
})
