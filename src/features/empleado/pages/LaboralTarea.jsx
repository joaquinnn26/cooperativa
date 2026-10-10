import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Zap, UserRound, Activity } from 'lucide-react'
import { archivoPayload, descargarLaboral, laboralApi, apiLaboralExistente, tareaEstados } from '@/utils/laboral.js'
import TrabajoMedidorDialog from './TrabajoMedidorDialog.jsx'

const labels = { Iniciar: 'Iniciar trabajo', Avance: 'Guardar avance', EnviarRevision: 'Enviar a revisión', Asignar: 'Asignar o reasignar', Aprobar: 'Aprobar resultado', Rechazar: 'Rechazar con motivo', Devolver: 'Devolver para corregir', Cerrar: 'Cerrar y confirmar operación' }
export default function LaboralTarea() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [team, setTeam] = useState([])
  const [motivos, setMotivos] = useState([])
  const [meters, setMeters] = useState([])
  const [route, setRoute] = useState(null)
  const preserveDraft = useRef(false)
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
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('')
    laboralApi(`/tareas/${id}`, { signal: abort.signal }).then(async detail => {
      if (abort.signal.aborted) return
      setData(detail)
      if (!preserveDraft.current) { setResult(detail.tarea.Resultado || ''); setTechnical(detail.tarea.DatosResultado ? JSON.parse(detail.tarea.DatosResultado) : null) }
      preserveDraft.current = false
      if (detail.tarea.Categoria === 'Ruta') setRoute(await apiLaboralExistente(`/rutas-medicion/${detail.tarea.OrigenId}`, { signal: abort.signal }))
      else setRoute(null)
      const [people, reasons, equipment] = await Promise.all([detail.acciones.includes('Asignar') ? laboralApi(`/equipo?area=${detail.tarea.Area}`, { signal: abort.signal }) : [], detail.acciones.some(a => ['Rechazar', 'Devolver'].includes(a)) ? laboralApi(`/motivos?area=${detail.tarea.Area}`, { signal: abort.signal }) : [], detail.tarea.idServicioSocio ? laboralApi(`/tareas/${id}/medidores`, { signal: abort.signal }) : []])
      if (!abort.signal.aborted) { setTeam(people); setMotivos(reasons); setMeters(equipment) }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [id, refresh])
  async function send(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await laboralApi(`/tareas/${id}/accion`, { method: 'POST', body: JSON.stringify({ Accion: action, Version: data.tarea.Version, idEmpleado: employee ? Number(employee) : null, Motivo: reason, idMotivo: motivo ? Number(motivo) : null, Resultado: result, DatosResultado: technical }) })
      setNotice('Operación guardada con su historial.'); setAction(''); setReason(''); setMotivo(''); setRefresh(r => r + 1)
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
  const t = data.tarea, editable = data.acciones.includes('Avance'), needsReason = ['Rechazar', 'Devolver'].includes(action)
  const requiredFunction = t.Categoria === 'Ruta' ? 'LECTURISTA' : t.Area === 'ADMINISTRACION' ? 'ATENCION' : 'OPERARIO'
  const origin = data.origen?.[0]
  return <div className="field-task mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-6">
    <header className="field-task-hero"><Link className="field-task-back" to={`/empleado/areas/${t.Area}`}><ArrowLeft size={16} /> Volver al área</Link><div className="field-task-hero-main"><div className="field-task-hero-copy"><span className="field-task-eyebrow"><ClipboardList size={15} /> {t.AreaNombre} · {tareaEstados[t.Estado]}</span><h1>{t.Titulo}</h1><p>{t.Socio || 'Trabajo interno'}{(origin?.Servicio || t.Servicio) && ` · ${origin?.Servicio || t.Servicio}`}{t.Direccion && ` · ${t.Direccion}`}</p></div><span className="field-task-hero-icon"><Zap size={34} /></span></div><div className="field-task-meta"><span><UserRound size={15} /> Responsable: {t.Asignado?.trim() || 'Sin asignar'}</span><span><Activity size={15} /> {t.Categoria || 'Tarea'}</span></div></header>
    {error && <p role="alert" className="field-task-alert field-task-alert-error">{error}</p>}{notice && <p role="status" className="field-task-alert field-task-alert-success">{notice}</p>}
    {origin?.Observaciones && <div className="card"><h2 className="font-semibold">Datos de la solicitud</h2><p className="whitespace-pre-wrap">{origin.Observaciones}</p></div>}
    {route && <section className="card space-y-3"><h2 className="font-semibold">Resultado del recorrido: {route.nombre}</h2><p>{route.fecha} · {route.empleadoNombre} · {route.estado}</p>{route.items.map(i => <div key={i.idMedidor} className="border-t py-2"><p>{i.socioNombre} · {i.servicioNombre} · Medidor {i.numeroMedidor}</p><p>{i.estado} · Lectura {i.lecturaActual ?? 'sin registrar'} · {i.observacion}</p></div>)}{route.firmaDigital && <img alt="Firma de cierre del lecturista" src={route.firmaDigital} className="max-h-40" />}</section>}
    {(data.documentosSolicitud?.length > 0 || t.Categoria === 'Documentacion') && <section className="card space-y-2"><h2 className="font-semibold">Documentación para revisar</h2>{data.documentosSolicitud?.map(d => <button className="block text-blue-700 underline" key={d.idDocumentoSolicitud} onClick={() => download(`/documentos-solicitud/${d.idDocumentoSolicitud}`, d.NombreArchivo)}>{d.NombreArchivo}</button>)}{t.Categoria === 'Documentacion' && <button className="text-blue-700 underline" onClick={() => download(`/documentos/${t.OrigenId}`, 'documento-socio')}>Descargar documento del socio</button>}</section>}
    <section className="card space-y-3"><h2 className="font-semibold">Resultado del trabajo</h2>{editable ? <label className="block">Qué se realizó y cuál fue el resultado<textarea maxLength={2000} className="input-field min-h-28" value={result} onChange={e => setResult(e.target.value)} /></label> : <p className="whitespace-pre-wrap">{t.Resultado || 'Todavía no se registró un resultado.'}</p>}
      {editable && t.Categoria === 'Instalacion' && ['AGUA', 'ENERGIA'].includes(t.Area) && <button className="btn-secondary" onClick={() => setWork({})}>Completar datos del medidor instalado</button>}
      {editable && t.Categoria === 'Trabajo' && meters.map(m => <div key={m.idMedidor} className="flex gap-3 flex-wrap items-center"><span>Medidor instalado: {m.Numero}</span><button className="btn-secondary" onClick={() => setWork({ anterior: m })}>Registrar reemplazo</button><button className="btn-secondary" onClick={() => setWork({ anterior: m, retirar: true })}>Registrar retiro</button></div>)}
      {technical && <div className="rounded-lg bg-blue-50 p-3 text-sm"><strong>Resultado técnico adjunto</strong><p>{technical.TipoTrabajo || 'Instalación'} · {technical.NuevoMedidor ? `Equipo nuevo: ${technical.NuevoMedidor.Numero}` : technical.idMedidor ? `Equipo del inventario #${technical.idMedidor}` : `Equipo retirado #${technical.idAnterior}`}</p><p>Lectura {technical.TipoTrabajo === 'Retiro' ? 'final' : 'inicial'}: {technical.Lectura}{technical.LecturaFinal != null && ` · Lectura final anterior: ${technical.LecturaFinal}`}</p>{technical.EstadoRetirado && <p>Condición del retirado: {technical.EstadoRetirado}</p>}{technical.Detalle && <p>{technical.Detalle}</p>}<p>La operación se aplicará al cerrar la tarea, después de su revisión.</p></div>}
      <h3 className="font-semibold">Evidencias</h3>{data.evidencias.map(f => <button className="block text-blue-700 underline" key={f.idEvidencia} onClick={() => download(`/evidencias/${f.idEvidencia}`, f.Nombre)}>{f.Nombre} · {new Date(f.FechaUtc).toLocaleString('es-AR')}</button>)}{!data.evidencias.length && <p className="text-sm text-gray-500">Sin archivos adjuntos.</p>}{editable && <label className="block">Adjuntar foto o documento (PDF, PNG o JPEG; hasta 2 MB)<input disabled={busy} className="input-field" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => upload(e.target.files?.[0])} /></label>}
    </section>
    {data.acciones.length > 0 && <form onSubmit={send} className="card space-y-3"><h2 className="font-semibold">Acciones disponibles</h2><div className="flex flex-wrap gap-2">{data.acciones.map(a => <button type="button" key={a} disabled={busy} className={action === a ? 'btn-primary' : 'btn-secondary'} onClick={() => { setAction(a); setMotivo('') }}>{labels[a]}</button>)}</div>{action && <fieldset disabled={busy} className="space-y-3">{action === 'Asignar' && <label className="block">Empleado del área<select required className="input-field" value={employee} onChange={e => setEmployee(e.target.value)}><option value="">Seleccionar</option>{team.filter(e => String(e.Funciones || '').split(', ').includes(requiredFunction)).map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{e.Nombre} · {requiredFunction} · {e.Pendientes} pendientes</option>)}</select>{!team.some(e => String(e.Funciones || '').split(', ').includes(requiredFunction)) && <p className="text-amber-800">No hay empleados disponibles con la función requerida. Pedí a Administración que la asigne.</p>}</label>}{needsReason && <label className="block">Motivo<select required className="input-field" value={motivo} onChange={e => setMotivo(e.target.value)}><option value="">Seleccionar motivo</option>{motivos.filter(m => m.Accion === action).map(m => <option key={m.idMotivo} value={m.idMotivo}>{m.Nombre}</option>)}</select>{!motivos.some(m => m.Accion === action) && <p className="text-amber-800">Falta configurar los motivos predefinidos para esta decisión.</p>}</label>}{!needsReason && <label className="block">Detalle de la decisión{action === 'Asignar' && t.idEmpleadoAsignado ? ' (obligatorio al reasignar)' : ' (opcional)'}<textarea required={action === 'Asignar' && !!t.idEmpleadoAsignado} maxLength={1000} className="input-field" value={reason} onChange={e => setReason(e.target.value)} /></label>}{action === 'Cerrar' && <p className="text-sm bg-amber-50 p-3">Se confirmará el resultado aprobado y se aplicarán los cambios de esta etapa.</p>}<button disabled={busy || (action === 'Asignar' && !team.some(e => String(e.Funciones || '').split(', ').includes(requiredFunction)))} className="btn-primary">{busy ? 'Guardando…' : labels[action]}</button></fieldset>}</form>}
    <section className="card space-y-3"><h2 className="font-semibold">Historial de intervenciones</h2>{data.historial.map(h => <div className="border-l-4 pl-3 border-blue-200 text-sm" key={h.idAuditoria}><strong>{labels[h.Accion] || h.Accion}</strong> · {h.Responsable}<p>{tareaEstados[h.EstadoAnterior]} → {tareaEstados[h.EstadoNuevo]}</p><p>{h.Motivo}</p><time>{new Date(h.FechaUtc).toLocaleString('es-AR')}</time></div>)}{t.FechaCierreUtc && <p>Tiempo total hasta el cierre: {Math.round((new Date(t.FechaCierreUtc) - new Date(t.FechaCreacionUtc)) / 60000)} minutos.</p>}</section>
    {work && <TrabajoMedidorDialog soloResultado request={{ socioNombre: t.Socio, servicioNombre: origin?.Servicio || t.Servicio, direccion: t.Direccion }} {...work} onClose={() => setWork(null)} onConfirm={async payload => { setTechnical({ ...payload, ...(work.anterior ? { TipoTrabajo: work.retirar ? 'Retiro' : 'Reemplazo', idAnterior: work.anterior.idMedidor } : {}) }); setNotice('Datos adjuntos al formulario. Guardá el avance o enviá el resultado a revisión.'); }} />}
  </div>
}
