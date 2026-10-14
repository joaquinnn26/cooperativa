import React, { useEffect, useRef } from 'react'
import { X, UserRound } from 'lucide-react'

export default function AsignarTareaDialog({ task, candidates, employee, onEmployee, reason, onReason, busy, error, onSubmit, onClose }) {
  const ref = useRef(null)
  const reassign = Boolean(task.idEmpleadoAsignado)
  useEffect(() => { ref.current.showModal() }, [])
  return <dialog ref={ref} className="task-assignment-dialog" aria-labelledby="task-assignment-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <form onSubmit={onSubmit} className="space-y-4">
      <header className="flex items-start justify-between gap-4"><div><h2 id="task-assignment-title" className="text-xl font-semibold">{reassign ? 'Reasignar tarea' : 'Asignar responsable'}</h2><p className="mt-1 text-sm text-gray-500">{task.Titulo}</p></div><button type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={20}/></button></header>
      {reassign && <div className="task-assignment-current"><UserRound size={19}/><div><small>Responsable actual</small><strong>{task.Asignado?.trim() || 'Empleado asignado'}</strong></div></div>}
      <p className="text-sm text-gray-600">{reassign ? 'Elegí quién continuará el trabajo. Se conservarán la etapa, los avances y las evidencias.' : 'La tarea aparecerá en la lista del empleado seleccionado.'}</p>
      {error && <p role="alert" className="field-task-alert field-task-alert-error">{error}</p>}
      <label className="block text-sm font-medium">{reassign ? 'Nuevo responsable' : 'Empleado responsable'}<select autoFocus required disabled={busy || !candidates.length} className="input-field mt-2" value={employee} onChange={event => onEmployee(event.target.value)}><option value="">Seleccioná una persona</option>{candidates.map(person => <option key={person.idEmpleado} value={person.idEmpleado}>{person.Nombre} · {person.Pendientes} tareas pendientes</option>)}</select></label>
      {!candidates.length && <p role="status" className="text-sm text-amber-800">No hay otros empleados con la función necesaria en esta área.</p>}
      <label className="block text-sm font-medium">Motivo {reassign ? 'de la reasignación (obligatorio)' : '(opcional)'}<textarea required={reassign} disabled={busy} maxLength={1000} className="input-field mt-2" value={reason} onChange={event => onReason(event.target.value)} placeholder={reassign ? 'Explicá por qué se cambia el responsable.' : 'Indicaciones para el responsable.'}/></label>
      <footer className="flex justify-end gap-2"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy || !employee || !candidates.length}>{busy ? 'Guardando…' : reassign ? 'Confirmar reasignación' : 'Confirmar asignación'}</button></footer>
    </form>
  </dialog>
}
