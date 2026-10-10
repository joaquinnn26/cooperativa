export function assignmentPayload(data, form) {
  const employee = data.empleados.find(e => String(e.idEmpleado) === String(form.idEmpleado) && e.Activo)
  const area = data.areas.find(a => a.Codigo === form.Area)
  const puesto = data.puestos.find(p => p.Area === form.Area && p.Codigo === form.Puesto)
  if (!employee) throw new Error('Seleccioná un empleado activo.')
  if (!area || !puesto) throw new Error('Seleccioná un área y un puesto compatible.')
  if (!form.Motivo?.trim()) throw new Error('Seleccioná el motivo del cambio.')
  const previous = data.miembros.filter(m => m.idEmpleado === employee.idEmpleado && !m.HastaUtc)
  if (previous.length > 1) throw new Error('El empleado tiene varias asignaciones previas. Actualizá la configuración antes de continuar.')
  if (previous[0] && (previous[0].Area !== form.Area || previous[0].Puesto !== form.Puesto) && !form.ConfirmarTraslado) throw new Error('Confirmá el cambio de área o puesto.')
  const leader = data.encargados.find(m => m.Area === form.Area && !m.HastaUtc)
  if (puesto.EsEncargado && leader && leader.idEmpleado !== employee.idEmpleado && !form.ReemplazarEncargado) throw new Error('Confirmá el reemplazo del encargado actual.')
  return {
    idEmpleado: employee.idEmpleado, Area: form.Area, Puesto: form.Puesto,
    Motivo: form.Motivo.trim(), Version: employee.Version, VersionArea: area.Version,
    ConfirmarTraslado: Boolean(form.ConfirmarTraslado), ReemplazarEncargado: Boolean(form.ReemplazarEncargado)
  }
}
