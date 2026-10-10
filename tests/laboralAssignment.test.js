import test from 'node:test'
import assert from 'node:assert/strict'
import { assignmentPayload } from '../src/utils/laboralAssignment.js'

const data = () => ({
  empleados: [{ idEmpleado: 1, Activo: true, Version: 'employee-v1' }, { idEmpleado: 2, Activo: false }],
  areas: [{ Codigo: 'AGUA', Version: 'water-v1' }, { Codigo: 'ENERGIA', Version: 'energy-v1' }, { Codigo: 'GERENCIA', Version: 'manager-v1' }],
  puestos: [{ Area: 'AGUA', Codigo: 'OPERARIO', EsEncargado: false }, { Area: 'AGUA', Codigo: 'ENCARGADO', EsEncargado: true }, { Area: 'ENERGIA', Codigo: 'LECTURISTA', EsEncargado: false }, { Area: 'GERENCIA', Codigo: 'GERENTE', EsEncargado: false }],
  miembros: [], encargados: []
})
const form = { idEmpleado: '1', Area: 'AGUA', Puesto: 'OPERARIO', Motivo: 'Asignación inicial' }

test('asignación inicial envía área, puesto y versiones sin un cargo independiente', () => {
  const result = assignmentPayload(data(), form)
  assert.equal(result.idEmpleado, 1)
  assert.equal(result.Puesto, 'OPERARIO')
  assert.equal(result.Version, 'employee-v1')
  assert.equal(result.VersionArea, 'water-v1')
  assert.equal('idCargo' in result, false)
})
test('rechaza puestos de otra área y empleados inactivos', () => {
  assert.throws(() => assignmentPayload(data(), { ...form, Puesto: 'GERENTE' }), /compatible/)
  assert.throws(() => assignmentPayload(data(), { ...form, idEmpleado: '2' }), /activo/)
})
test('traslado requiere confirmación explícita', () => {
  const config = data(); config.miembros = [{ idEmpleado: 1, Area: 'AGUA', HastaUtc: null }]
  const next = { ...form, Area: 'ENERGIA', Puesto: 'LECTURISTA' }
  assert.throws(() => assignmentPayload(config, next), /cambio de área o puesto/)
  assert.equal(assignmentPayload(config, { ...next, ConfirmarTraslado: true }).Area, 'ENERGIA')
})
test('cambiar el puesto dentro del área exige confirmar el cambio', () => {
  const config = data(); config.miembros = [{ idEmpleado: 1, Area: 'AGUA', HastaUtc: null }]
  config.miembros[0].Puesto = 'OPERARIO'
  assert.throws(() => assignmentPayload(config, { ...form, Puesto: 'ENCARGADO' }), /cambio de área o puesto/)
  assert.equal(assignmentPayload(config, { ...form, Puesto: 'ENCARGADO', ConfirmarTraslado: true }).ConfirmarTraslado, true)
})
test('reemplazar un encargado exige confirmación explícita', () => {
  const config = data(); config.encargados = [{ Area: 'AGUA', idEmpleado: 99, HastaUtc: null }]
  assert.throws(() => assignmentPayload(config, { ...form, Puesto: 'ENCARGADO' }), /reemplazo/)
  assert.equal(assignmentPayload(config, { ...form, Puesto: 'ENCARGADO', ReemplazarEncargado: true }).ReemplazarEncargado, true)
})
test('Gerencia solo permite el puesto gerente del catálogo', () => {
  assert.equal(assignmentPayload(data(), { ...form, Area: 'GERENCIA', Puesto: 'GERENTE' }).Puesto, 'GERENTE')
  assert.throws(() => assignmentPayload(data(), { ...form, Area: 'GERENCIA', Puesto: 'ENCARGADO' }), /compatible/)
})
test('el historial de áreas finalizadas no impide una nueva asignación', () => {
  const config = data(); config.miembros = [{ idEmpleado: 1, Area: 'ENERGIA', HastaUtc: '2026-01-01' }]
  assert.equal(assignmentPayload(config, form).Area, 'AGUA')
})
