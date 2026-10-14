import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Zap, UserRound, Activity, Gauge, CheckCircle2, LockKeyhole } from 'lucide-react'
import { archivoPayload, descargarLaboral, laboralApi, apiLaboralExistente, tareaEstados } from '@/utils/laboral.js'
import TrabajoMedidorDialog from './TrabajoMedidorDialog.jsx'
import AsignarTareaDialog from './AsignarTareaDialog.jsx'
import RevisionDocumentalSolicitud from './RevisionDocumentalSolicitud.jsx'
import { taskWorkflow, installationMeterIssue } from '@/utils/laboralTaskProgress.js'
import './LaboralTarea.css'
import TareaResultadoWizard from './TareaResultadoWizard.jsx'
import { showInfo, showToast, confirmAction } from '@/utils/alerts.js'

const labels = { AprobarDocumentos: 'Documentación aprobada', Iniciar: 'Iniciar trabajo', Avance: 'Guardar avance', EnviarRevision: 'Enviar al encargado', NoSePudoInstalar: 'No pude realizar la instalación', Asignar: 'Asignar o reasignar', Aprobar: 'Aprobar resultado', Rechazar: 'Rechazar con motivo', Devolver: 'Devolver para corregir', Cerrar: 'Finalizar y confirmar' }
const actionHelp = {
  Iniciar: 'Confirmá el inicio para dejar constancia de que comenzaste el trabajo.',
  Avance: 'Guardá el resultado y las evidencias del trabajo realizado.',
  EnviarRevision: 'El encargado revisará el resultado y las evidencias adjuntas.',
  Asignar: 'Elegí a la persona responsable. La tarea aparecerá en su lista de trabajo.',
  NoSePudoInstalar: 'La solicitud seguira pendiente; explica por que no se pudo realizar la visita para que el encargado pueda reasignarla.',
  Aprobar: 'Confirmá que el resultado y las evidencias cumplen lo solicitado.',
  Rechazar: 'Indicá un motivo para dejar asentada la decisión.',
  Devolver: 'Explicá qué debe corregirse para que la persona pueda continuar.',
  Cerrar: 'Se cerrará la tarea y se aplicarán los cambios operativos aprobados.'
}
export default function LaboralTarea() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [team, setTeam] = useState([])
  const [motivos, setMotivos] = useState([])
  const [meters, setMeters] = useState([])
  const [route, setRoute] = useState(null)
  const preserveDraft = useRef(false)
  const loadedTaskId = useRef(null)
  const [action, setAction] = useState('')
  const [employee, setEmployee] = useState('')
  const [reason, setReason] = useState('')
  const [motivo, setMotivo] = useState('')
  const [result, setResult] = useState('')
  const [technical, setTechnical] = useState(null)
  const [work, setWork] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => { if (error) showInfo({ title: 'No se pudo continuar', message: error, type: 'error', target: document.querySelector('dialog[open]') || undefined }).then(() => setError(current => current === error ? '' : current)) }, [error])
  useEffect(() => { if (notice) { showToast({ title: 'Listo', message: notice, type: 'success' }); setNotice('') } }, [notice])
  useEffect(() => {
    const abort = new AbortController(); if (loadedTaskId.current !== id) setLoading(true); setError('')
    laboralApi(`/tareas/${id}`, { signal: abort.signal }).then(async detail => {
      if (abort.signal.aborted) return
      setData(detail); loadedTaskId.current = id
      setAction(current => detail.acciones.includes(current) && current !== 'Asignar' ? current : ['Iniciar', 'EnviarRevision', 'Aprobar', 'Cerrar'].find(item => detail.acciones.includes(item)) || '')
      if (!preserveDraft.current) { setResult(detail.tarea.Resultado || ''); setTechnical(detail.tarea.DatosResultado ? JSON.parse(detail.tarea.DatosResultado) : null) }
      preserveDraft.current = false
      if (detail.tarea.Categoria === 'Ruta') setRoute(await apiLaboralExistente(`/rutas-medicion/${detail.tarea.OrigenId}`, { signal: abort.signal }))
      else setRoute(null)
      const [people, reasons, equipment] = await Promise.all([detail.acciones.includes('Asignar') ? laboralApi(`/equipo?area=${detail.tarea.Area}`, { signal: abort.signal }) : [], detail.acciones.some(a => ['Rechazar', 'Devolver'].includes(a)) ? laboralApi(`/motivos?area=${detail.tarea.Area}`, { signal: abort.signal }) : [], detail.tarea.idServicioSocio ? laboralApi(`/tareas/${id}/medidores`, { signal: abort.signal }) : []])
      if (!abort.signal.aborted) { setTeam(people); setMotivos(reasons); setMeters(equipment) }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [id, refresh])
  async function send(e, selectedAction = action, extra = {}) {
    e.preventDefault()
    if (busy) return
    const meterIssue = installationMeterIssue(data.tarea, technical)
    if (['EnviarRevision', 'Aprobar', 'Cerrar'].includes(selectedAction) && meterIssue) { setError(meterIssue); return }
    if (['Avance', 'EnviarRevision'].includes(selectedAction) && !result.trim()) { setError('Describí qué se realizó antes de guardar o enviar el resultado.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      if (['EnviarRevision', 'Aprobar', 'Cerrar', 'Rechazar', 'Devolver'].includes(selectedAction) && !await confirmAction({ title: labels[selectedAction], message: actionHelp[selectedAction], confirmButtonText: labels[selectedAction], cancelButtonText: 'Volver al formulario', danger: selectedAction === 'Rechazar' })) return
      await laboralApi(`/tareas/${id}/accion`, { method: 'POST', body: JSON.stringify({ Accion: selectedAction, Version: data.tarea.Version, idEmpleado: employee ? Number(employee) : null, Motivo: reason, idMotivo: motivo ? Number(motivo) : null, Resultado: result, DatosResultado: technical, ...extra }) })
      setNotice(selectedAction === 'AprobarDocumentos' ? 'Documentos aprobados. Ya podés asignar la instalación.' : selectedAction === 'Asignar' ? `Responsable actualizado: ${team.find(person => String(person.idEmpleado) === String(employee))?.Nombre || 'empleado seleccionado'}.` : selectedAction === 'Avance' ? 'Avance guardado. La tarea sigue abierta para continuar trabajando.' : selectedAction === 'EnviarRevision' ? 'Resultado enviado. Ahora el encargado debe revisarlo.' : selectedAction === 'Aprobar' ? 'Resultado aprobado. Falta finalizar para confirmar la operación.' : selectedAction === 'Cerrar' ? 'Trabajo finalizado y operación confirmada para el socio.' : selectedAction === 'NoSePudoInstalar' ? 'Visita registrada. La solicitud sigue pendiente para reasignar o reprogramar.' : 'Operación guardada en el historial.'); setAction(''); setReason(''); setMotivo(''); setRefresh(r => r + 1)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function upload(file) {
    if (!file) return
    setBusy(true); setError('')
    try { await laboralApi(`/tareas/${id}/evidencias`, { method: 'POST', body: JSON.stringify({ ...await archivoPayload(file), Version: data.tarea.Version }) }); preserveDraft.current = true; setNotice('Evidencia guardada. El resultado escrito se conserva; guardá el avance para registrarlo.'); setRefresh(r => r + 1) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function download(path, name) { try { await descargarLaboral(path, name) } catch (e) { setError(e.message) } }
  if (loading) return <div className="field-task-loading" role="status"><span className="field-task-loader" />Cargando tarea...</div>
  if (!data) return <p role="alert" className="card text-red-800">{error || 'No se pudo cargar el trabajo.'}</p>
  const t = data.tarea, editable = data.acciones.includes('Avance'), needsReason = ['Rechazar', 'Devolver'].includes(action), needsVisitReason = action === 'NoSePudoInstalar'
  const requiredFunction = t.Categoria === 'Ruta' ? 'LECTURISTA' : t.Area === 'ADMINISTRACION' ? 'ATENCION' : 'OPERARIO'
  const origin = data.origen?.[0]
  const meteredInstallation = t.Categoria === 'Instalacion' && ['AGUA', 'ENERGIA'].includes(t.Area)
  const meterIssue = installationMeterIssue(t, technical)
  const actionBlocked = ['EnviarRevision', 'Aprobar', 'Cerrar'].includes(action) && Boolean(meterIssue)
  const { stages, index: flowIndex, hasDocuments: hasDocumentStage } = taskWorkflow(t, data.historial, data.revisionDocumentalPendiente)
  const reviewDocuments = [...(data.documentosSolicitud || []).map(document => ({ key: `solicitud:${document.idDocumentoSolicitud}`, name: document.NombreArchivo, type: 'Documento de la solicitud', path: `/documentos-solicitud/${document.idDocumentoSolicitud}` })), ...(data.documentosLegajo || []).filter(document => document.Estado !== 'Rechazado').map(document => ({ key: `legajo:${document.idDocumentoPersona}`, name: document.NombreArchivo, type: document.Requisito, path: `/documentos-legajo/${document.idDocumentoPersona}` }))]
  const availableActions = data.acciones.filter(item => !['Asignar', 'AprobarDocumentos'].includes(item))
  const candidates = team.filter(person => String(person.Funciones || '').split(', ').includes(requiredFunction) && String(person.idEmpleado) !== String(t.idEmpleadoAsignado))
  const assigned = Boolean(t.idEmpleadoAsignado)
  const guidance = data.revisionDocumentalPendiente ? 'El encargado debe revisar y aprobar los documentos antes de asignar la instalacion.' : t.Estado === 'PendienteAsignacion' ? 'El encargado debe elegir al responsable para continuar.' : t.Estado === 'Asignada' ? `${t.Asignado?.trim() || 'El responsable'} debe iniciar el trabajo.` : t.Estado === 'EnCurso' ? 'El responsable registra avances y envia el resultado cuando termina.' : t.Estado === 'Observada' ? 'Hay correcciones pendientes. El encargado puede mantener o cambiar el responsable.' : t.Estado === 'EnRevision' ? 'El encargado debe revisar el resultado y las evidencias.' : t.Estado === 'Aprobada' ? 'Resultado aprobado. Falta confirmar el cierre para aplicar la operacion.' : t.Estado === 'Cerrada' ? 'Trabajo finalizado y operacion confirmada.' : 'Consulta el motivo y las intervenciones registradas.'
  function openAssignment() { setEmployee(''); setReason(''); setError(''); setMotivo(''); setAction('Asignar') }
  return <div className="field-task mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-6">
    <header className="field-task-hero"><Link className="field-task-back" to={`/empleado/areas/${t.Area}`}><ArrowLeft size={16} /> Volver al área</Link><div className="field-task-hero-main"><div className="field-task-hero-copy"><span className="field-task-eyebrow"><ClipboardList size={15} /> {t.AreaNombre} · {tareaEstados[t.Estado]}</span><h1>{t.Titulo}</h1><p>{t.Socio || 'Trabajo interno'}{(origin?.Servicio || t.Servicio) && ` · ${origin?.Servicio || t.Servicio}`}{t.Direccion && ` · ${t.Direccion}`}</p></div><span className="field-task-hero-icon"><Zap size={34} /></span></div><div className="field-task-meta"><span><UserRound size={15} /> Responsable: {t.Asignado?.trim() || 'Sin asignar'}</span><span><Activity size={15} /> {t.Categoria || 'Tarea'}</span></div></header>
    <nav className={`field-task-flow task-stages ${hasDocumentStage ? 'task-stages-documents' : ''} ${t.Estado === 'Rechazada' ? 'is-rejected' : ''}`} aria-label="Etapas de la tarea">{stages.map((step, index) => <div key={step} aria-current={index === flowIndex ? 'step' : undefined} className={`field-task-flow-step ${index < flowIndex ? 'is-done' : ''} ${index === flowIndex ? 'is-current' : ''}`}><span className="field-task-flow-dot">{index < flowIndex ? '✓' : index + 1}</span><span>{step}</span></div>)}<p>{guidance}</p></nav>
    <section className="task-responsibility" aria-label="Responsable de la tarea"><div className="task-responsibility-person"><span className="task-responsibility-icon"><UserRound size={24}/></span><div><p>Responsable actual</p><h2>{assigned ? t.Asignado?.trim() || 'Empleado asignado' : data.revisionDocumentalPendiente ? 'Primero: aprobar documentos' : 'Pendiente de asignacion'}</h2><small>{tareaEstados[t.Estado] || t.Estado}{assigned ? ' | El historial conserva los cambios de responsable.' : data.revisionDocumentalPendiente ? ' | Instalacion aun no habilitada.' : ' | Esperando una asignacion del encargado.'}</small></div></div>{data.acciones.includes('Asignar') && <button type="button" disabled={busy} className="btn-secondary" onClick={openAssignment}>{assigned ? 'Reasignar' : 'Asignar responsable'}</button>}</section>

    {origin?.Estado && <p className="card text-sm"><strong>Estado de la solicitud:</strong> {origin.Estado}</p>}
    {data.revisionDocumentalPendiente && data.puedeRevisarDocumentos && <RevisionDocumentalSolicitud documents={reviewDocuments} canApprove={data.acciones.includes('AprobarDocumentos')} busy={busy} onDownload={download} onApprove={(event, documents) => send(event, 'AprobarDocumentos', { DocumentosRevisados: documents })}/>}
    {origin?.Observaciones && <div className="card"><h2 className="font-semibold">Datos de la solicitud</h2><p className="whitespace-pre-wrap">{origin.Observaciones}</p></div>}
    {route && <section className="card space-y-3"><h2 className="font-semibold">Resultado del recorrido: {route.nombre}</h2><p>{route.fecha} · {route.empleadoNombre} · {route.estado}</p>{route.items.map(i => <div key={i.idMedidor} className="border-t py-2"><p>{i.socioNombre} · {i.servicioNombre} · Medidor {i.numeroMedidor}</p><p>{i.estado} · Lectura {i.lecturaActual ?? 'sin registrar'} · {i.observacion}</p></div>)}{route.firmaDigital && <img alt="Firma de cierre del lecturista" src={route.firmaDigital} className="max-h-40" />}</section>}
    {data.puedeRevisarDocumentos && t.Categoria === 'Documentacion' && <section className="card space-y-2"><h2 className="font-semibold">Documentación para revisar</h2>{data.documentosSolicitud?.map(d => <button className="block text-blue-700 underline" key={d.idDocumentoSolicitud} onClick={() => download(`/documentos-solicitud/${d.idDocumentoSolicitud}`, d.NombreArchivo)}>{d.NombreArchivo}</button>)}{t.Categoria === 'Documentacion' && <button className="text-blue-700 underline" onClick={() => download(`/documentos/${t.OrigenId}`, 'documento-socio')}>Descargar documento del socio</button>}</section>}
    {editable && <TareaResultadoWizard key={id} task={t} origin={origin} metered={meteredInstallation} meterIssue={meterIssue} technical={technical} result={result} setResult={setResult} reason={reason} setReason={setReason} meters={meters} evidences={data.evidencias} busy={busy} actions={data.acciones} openMeter={setWork} upload={upload} download={download} send={send}/>}{!editable && <section className="card task-workspace space-y-3"><div className="task-workspace-heading"><div><small>TRABAJO Y RESULTADO</small><h2 className="font-semibold">{editable ? 'Completá el trabajo en orden' : 'Resumen para revisión'}</h2></div><ClipboardList size={24}/></div>
      {meteredInstallation && <div className={`task-meter-gate ${meterIssue ? 'is-pending' : 'is-complete'}`}><span className="task-meter-gate-icon">{meterIssue ? <Gauge size={25}/> : <CheckCircle2 size={25}/>}</span><div><small>PASO 1 · EQUIPO INSTALADO</small><h3>{meterIssue ? 'Registrá el medidor de esta instalación' : 'Datos del medidor completos'}</h3><p>Socio: <strong>{t.Socio}</strong> · {origin?.Servicio || t.Servicio}<br/>{t.Direccion || 'Domicilio pendiente de completar en el legajo del socio.'}</p><p>{t.Estado === 'Cerrada' ? 'La instalación fue confirmada al cerrar la tarea.' : 'Al cerrar la tarea, el equipo se asociará automáticamente a la conexión del socio de esta solicitud.'}</p>{editable && <button type="button" disabled={busy} className="btn-primary" onClick={() => setWork({})}>{technical ? 'Cambiar datos del medidor' : 'Registrar medidor instalado'}</button>}</div><span className="task-meter-status">{meterIssue ? 'Obligatorio' : 'Completo'}</span></div>}
      {meteredInstallation && <h3 className="task-workspace-step">PASO 2 · RESULTADO DE LA INSTALACIÓN</h3>}{editable ? <label className="block">Qué se realizó y cuál fue el resultado<textarea maxLength={2000} className="input-field min-h-28" value={result} onChange={e => setResult(e.target.value)} /></label> : <p className="whitespace-pre-wrap">{t.Resultado || 'Todavía no se registró un resultado.'}</p>}

      {editable && t.Categoria === 'Trabajo' && meters.map(m => <div key={m.idMedidor} className="flex gap-3 flex-wrap items-center"><span>Medidor instalado: {m.Numero}</span><button className="btn-secondary" onClick={() => setWork({ anterior: m })}>Registrar reemplazo</button><button className="btn-secondary" onClick={() => setWork({ anterior: m, retirar: true })}>Registrar retiro</button></div>)}
      {technical && <div className="rounded-lg bg-blue-50 p-3 text-sm"><strong>Resultado técnico adjunto</strong><p>{technical.TipoTrabajo || 'Instalación'} · {technical.NuevoMedidor ? `Equipo nuevo: ${technical.NuevoMedidor.Numero}` : technical.idMedidor ? `Equipo del inventario #${technical.idMedidor}` : `Equipo retirado #${technical.idAnterior}`}</p><p>Lectura {technical.TipoTrabajo === 'Retiro' ? 'final' : 'inicial'}: {technical.Lectura}{technical.LecturaFinal != null && ` · Lectura final anterior: ${technical.LecturaFinal}`}</p>{technical.EstadoRetirado && <p>Condición del retirado: {technical.EstadoRetirado}</p>}{technical.Detalle && <p>{technical.Detalle}</p>}<p>La operación se aplicará al cerrar la tarea, después de su revisión.</p></div>}
      <h3 className="font-semibold">Evidencias</h3>{data.evidencias.map(f => <button className="block text-blue-700 underline" key={f.idEvidencia} onClick={() => download(`/evidencias/${f.idEvidencia}`, f.Nombre)}>{f.Nombre} · {new Date(f.FechaUtc).toLocaleString('es-AR')}</button>)}{!data.evidencias.length && <p className="text-sm text-gray-500">Sin archivos adjuntos.</p>}{editable && <label className="block">Adjuntar foto o documento (PDF, PNG o JPEG; hasta 2 MB)<input disabled={busy} className="input-field" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => upload(e.target.files?.[0])} /></label>}
    </section>}
    {!editable && availableActions.length > 0 && <form onSubmit={send} className="card field-task-actions space-y-3"><div className="field-task-actions-heading"><span><ClipboardList size={18} /></span><div><h2>{meteredInstallation && editable ? 'Paso 3 · Enviar al encargado' : 'Continuar con la tarea'}</h2><p>La acción principal está seleccionada. Podés guardar un avance o informar un inconveniente cuando corresponda.</p></div></div><div className="field-task-action-choices">{availableActions.map(a => <button type="button" key={a} disabled={busy || (a === 'EnviarRevision' && Boolean(meterIssue))} title={a === 'EnviarRevision' ? meterIssue : undefined} className={`field-task-action-choice ${action === a ? 'is-selected' : ''} action-${a}`} onClick={() => { setAction(a); setMotivo('') }}><strong>{labels[a]}</strong><small>{actionHelp[a]}</small></button>)}</div>{meterIssue && meteredInstallation && t.Estado !== 'Cerrada' && <p className="task-gate-notice" role="status"><LockKeyhole size={17}/>{meterIssue} Podés guardar un borrador o informar una visita sin instalación.</p>}{action && action !== 'Asignar' && <fieldset disabled={busy} className="field-task-action-form space-y-3"><p className="field-task-action-help">{actionHelp[action]}</p>{needsVisitReason && <label className="block">Por que no se pudo instalar<textarea required minLength={5} maxLength={1000} className="input-field" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej.: No se pudo ingresar porque habia un perro suelto." /></label>}{needsReason && <label className="block">Motivo<select required className="input-field" value={motivo} onChange={e => setMotivo(e.target.value)}><option value="">Seleccioná un motivo</option>{motivos.filter(m => m.Accion === action).map(m => <option key={m.idMotivo} value={m.idMotivo}>{m.Nombre}</option>)}</select>{!motivos.some(m => m.Accion === action) && <p className="text-amber-800">Falta configurar los motivos predefinidos para esta decisión.</p>}</label>}{!needsReason && !needsVisitReason && <label className="block">Observación para el historial{action === 'Asignar' && t.idEmpleadoAsignado ? ' (obligatorio al reasignar)' : ' (opcional)'}<textarea required={action === 'Asignar' && !!t.idEmpleadoAsignado} maxLength={1000} className="input-field" value={reason} onChange={e => setReason(e.target.value)} /></label>}{action === 'Cerrar' && <p className="field-task-action-warning">Se confirmará el resultado aprobado y se aplicarán los cambios de esta etapa.</p>}<button disabled={busy || actionBlocked} className="btn-primary">{busy ? 'Guardando…' : labels[action]}</button></fieldset>}</form>}
    <details className="card task-history space-y-3"><summary>Historial de intervenciones <span>{data.historial.length} movimientos</span></summary>{data.historial.map(h => <div className="border-l-4 pl-3 border-blue-200 text-sm" key={h.idAuditoria}><strong>{labels[h.Accion] || h.Accion}</strong> · {h.Responsable}<p>{tareaEstados[h.EstadoAnterior]} → {tareaEstados[h.EstadoNuevo]}</p><p>{h.Motivo}</p><time>{new Date(h.FechaUtc).toLocaleString('es-AR')}</time></div>)}{t.FechaCierreUtc && <p>Tiempo total hasta el cierre: {Math.round((new Date(t.FechaCierreUtc) - new Date(t.FechaCreacionUtc)) / 60000)} minutos.</p>}</details>
    {action === 'Asignar' && <AsignarTareaDialog task={t} candidates={candidates} employee={employee} onEmployee={setEmployee} reason={reason} onReason={setReason} busy={busy} error={error} onSubmit={send} onClose={() => { if (!busy) { setAction(''); setError('') } }}/>}
    {work && <TrabajoMedidorDialog soloResultado request={{ socioNombre: t.Socio, servicioNombre: origin?.Servicio || t.Servicio, direccion: t.Direccion }} {...work} onClose={() => setWork(null)} onConfirm={async payload => { setTechnical({ ...payload, ...(work.anterior ? { TipoTrabajo: work.retirar ? 'Retiro' : 'Reemplazo', idAnterior: work.anterior.idMedidor } : {}) }); setNotice('Datos adjuntos al formulario. Guardá el avance o enviá el resultado a revisión.'); }} />}
  </div>
}
