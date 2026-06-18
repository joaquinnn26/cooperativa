import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAssignableRouteEmployees,
  isMeterReader,
  isRouteEmployeeActive
} from '../src/utils/measurementRoute.js'

test('el administrador puede asignar una ruta a cualquier empleado activo', () => {
  const employees = [
    { idEmpleado: 1, Activo: true, Cargo: { Nombre: 'Tecnico' }, Persona: { Apellido: 'Perez' } },
    { idEmpleado: 2, Activo: false, Cargo: { Nombre: 'Lecturista' }, Persona: { Apellido: 'Diaz' } },
    { idEmpleado: 3, Activo: true, Cargo: { Nombre: 'Lecturista de medidores' }, Persona: { Apellido: 'Lopez' } }
  ]

  assert.deepEqual(
    getAssignableRouteEmployees(employees).map((employee) => employee.idEmpleado),
    [3, 1]
  )
})

test('reconoce lecturistas sin depender de mayusculas o tildes', () => {
  assert.equal(isMeterReader({ Cargo: { Nombre: 'LECTURISTA' } }), true)
  assert.equal(isRouteEmployeeActive({ Activo: false }), false)
})
