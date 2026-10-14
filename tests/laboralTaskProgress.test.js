import test from 'node:test'
import assert from 'node:assert/strict'
import { taskProgress, taskWorkflow } from '../src/utils/laboralTaskProgress.js'

test('asignar por primera vez mantiene la preparación hasta iniciar', () => {
  assert.equal(taskProgress({ Estado: 'PendienteAsignacion' }), 0)
  assert.equal(taskProgress({ Estado: 'Asignada', idEmpleadoAsignado: 12 }), 0)
})
test('reasignar o reprogramar una visita conserva la etapa de trabajo alcanzada', () => {
  const history = [{ Accion: 'Iniciar', EstadoAnterior: 'Asignada', EstadoNuevo: 'EnCurso' }]
  assert.equal(taskProgress({ Estado: 'Asignada' }, history), 1)
  assert.equal(taskProgress({ Estado: 'PendienteAsignacion' }, history), 1)
  assert.equal(taskProgress({ Estado: 'EnCurso', idEmpleadoAsignado: 18 }, history), 1)
})
test('corregir, revisar y finalizar muestran la etapa correspondiente', () => {
  assert.equal(taskProgress({ Estado: 'Observada' }), 1)
  assert.equal(taskProgress({ Estado: 'EnRevision' }), 2)
  assert.equal(taskProgress({ Estado: 'Aprobada' }), 2)
  assert.equal(taskProgress({ Estado: 'Cerrada' }), 3)
  assert.equal(taskProgress({ Estado: 'Rechazada' }), 3)
})

test('la revisión documental precede a la asignación y conserva su aprobación en las etapas siguientes', () => {
  const pending = taskWorkflow({ Estado: 'PendienteAsignacion' }, [], true)
  assert.equal(pending.stages[0], 'Documentación')
  assert.equal(pending.index, 0)
  const approval = [{ Accion: 'AprobarDocumentos' }]
  assert.equal(taskWorkflow({ Estado: 'PendienteAsignacion' }, approval).index, 1)
  assert.equal(taskWorkflow({ Estado: 'Asignada' }, approval).index, 1)
  assert.equal(taskWorkflow({ Estado: 'EnCurso' }, approval).index, 2)
  assert.equal(taskWorkflow({ Estado: 'Cerrada' }, approval).index, 4)
  assert.equal(taskWorkflow({ Estado: 'EnCurso' }, []).hasDocuments, false)
})
