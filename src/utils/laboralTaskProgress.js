export const taskStages = ['Preparación', 'Trabajo', 'Revisión', 'Finalización']

export function installationMeterIssue(task, technical) {
  if (task.Categoria !== 'Instalacion' || !['AGUA', 'ENERGIA'].includes(task.Area)) return ''
  if (!technical || technical.TipoTrabajo) return 'Registrá el medidor instalado para habilitar el envío a revisión.'
  const reading = technical.Lectura
  if (reading == null || String(reading).trim() === '' || !Number.isFinite(Number(reading)) || Number(reading) < 0) return 'Falta una lectura inicial válida del medidor.'
  const fresh = technical.NuevoMedidor
  if (Boolean(fresh) === (Number(technical.idMedidor) > 0)) return 'Elegí un equipo del inventario o registrá uno nuevo.'
  if (fresh && (!fresh.Numero?.trim() || !fresh.idTipoMedidor)) return 'Completá los datos del equipo nuevo.'
  if (!fresh && !technical.Version) return 'Volvé a seleccionar el equipo del inventario.'
  return ''
}

export function taskWorkflow(task, history = [], documentReviewPending = false) {
  const hasDocuments = documentReviewPending || history.some(event => event.Accion === 'AprobarDocumentos')
  return {
    stages: hasDocuments ? ['Documentación', ...taskStages] : taskStages,
    index: documentReviewPending ? 0 : taskProgress(task, history) + (hasDocuments ? 1 : 0),
    hasDocuments
  }
}

export function taskProgress(task, history = []) {
  if (['Cerrada', 'Rechazada'].includes(task.Estado)) return 3
  if (['EnRevision', 'Aprobada'].includes(task.Estado)) return 2
  if (['EnCurso', 'Observada'].includes(task.Estado)) return 1
  const started = history.some(event =>
    ['Iniciar', 'NoSePudoInstalar'].includes(event.Accion) ||
    [event.EstadoAnterior, event.EstadoNuevo].some(state => ['EnCurso', 'Observada', 'EnRevision', 'Aprobada'].includes(state)))
  return started ? 1 : 0
}
