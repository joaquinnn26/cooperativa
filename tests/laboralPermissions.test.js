import test from 'node:test'
import assert from 'node:assert/strict'
import { inicioLaboral, permiteRutaLaboral, rutasLaborales } from '../src/utils/laboralPermissions.js'

test('una cuenta sin área solo puede entrar al panel de asignación pendiente', () => {
  assert.equal(permiteRutaLaboral([], '/empleado'), true)
  assert.deepEqual(rutasLaborales([]), [])
  for (const route of ['/empleado/areas/AGUA', '/empleado/tareas/12', '/empleado/estadisticas-eventos', '/empleado/facturas', '/empleado/reportes']) {
    assert.equal(permiteRutaLaboral([], route), false, route)
  }
})

test('al asignar un área se habilita su vista sin conceder funciones de otra área', () => {
  const areas = [{ Area: 'AGUA', Nombre: 'Agua', Encargado: false, Funciones: [] }]
  assert.equal(inicioLaboral(areas), '/empleado/areas/AGUA')
  assert.equal(permiteRutaLaboral(areas, '/empleado/areas/AGUA'), true)
  assert.equal(permiteRutaLaboral(areas, '/empleado/areas/ENERGIA'), false)
  assert.equal(permiteRutaLaboral(areas, '/empleado/facturas'), false)
  assert.equal(permiteRutaLaboral(areas, '/empleado/rutas-medicion'), false)
  assert.equal(permiteRutaLaboral(areas, '/empleado/estadisticas-eventos'), true)
})

test('asignar y quitar encargado cambia el acceso a la organización de recorridos', () => {
  const member = { Area: 'AGUA', Nombre: 'Agua', Encargado: false, Funciones: [] }
  assert.equal(permiteRutaLaboral([member], '/empleado/rutas-medicion'), false)
  assert.equal(permiteRutaLaboral([{ ...member, Encargado: true }], '/empleado/rutas-medicion'), true)
  assert.equal(permiteRutaLaboral([member], '/empleado/rutas-medicion'), false)
})

test('las funciones habilitan solo las herramientas correspondientes', () => {
  const areas = [{ Area: 'AGUA', Nombre: 'Agua', Encargado: false, Funciones: ['LECTURISTA'] }]
  assert.equal(permiteRutaLaboral(areas, '/empleado/hoja-ruta'), true)
  assert.equal(permiteRutaLaboral(areas, '/empleado/mediciones'), false)
  assert.equal(permiteRutaLaboral(areas, '/empleado/atencion'), false)
})

test('el inicio conserva el selector para varias áreas y el resumen de Gerencia', () => {
  assert.equal(inicioLaboral([]), '/empleado')
  assert.equal(inicioLaboral([{ Area: 'AGUA' }, { Area: 'ENERGIA' }]), '/empleado')
  assert.equal(inicioLaboral([{ Area: 'GERENCIA', Funciones: ['CONSULTA_GENERAL'] }]), '/empleado')
})
