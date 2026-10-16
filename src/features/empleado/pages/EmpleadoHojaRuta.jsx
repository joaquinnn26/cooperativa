import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useCurrentEmpleado } from '@/hooks/useCurrentEmpleado.js'
import { eventosOperativosApi } from '@/utils/eventosOperativosApi.js'
import { descargarApi, apiLaboralExistente } from '@/utils/laboral.js'
import { confirmAction, showInfo, showToast } from '@/utils/alerts.js'
import LecturistaRutaView from './LecturistaRutaView.jsx'
import { localRouteDate } from './recorridosUtils.js'

const alertTarget = () => [...document.querySelectorAll('dialog[open]')].at(-1)
export default function EmpleadoHojaRuta() {
  const idEmpleado = useAuthStore(state => state.idEmpleado), areas = useAuthStore(state => state.areas) || []
  const usuario = useAuthStore(state => state.usuario), nombre = useAuthStore(state => state.nombre)
  const { empleadoId, loadingEmpleado, resolveEmpleadoId } = useCurrentEmpleado()
  const fetchTypes = useServiceWorkflowStore(state => state.fetchMeasurementTypes)
  const fetchRoutes = useServiceWorkflowStore(state => state.fetchMeasurementRoutesByEmployee)
  const startRoute = useServiceWorkflowStore(state => state.startMeasurementRoute)
  const saveReading = useServiceWorkflowStore(state => state.saveMeasurementRouteReading)
  const saveIssue = useServiceWorkflowStore(state => state.updateMeasurementRouteItem)
  const completeRoute = useServiceWorkflowStore(state => state.completeMeasurementRoute)
  const [routes, setRoutes] = useState([]), [types, setTypes] = useState([]), [reasons, setReasons] = useState([])
  const [selectedId, setSelectedId] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [readings, setReadings] = useState({}), [photos, setPhotos] = useState({}), [selectedReasons, setSelectedReasons] = useState({}), [notes, setNotes] = useState({})
  const [busy, setBusy] = useState(false), [signature, setSignature] = useState('')
  const request = useRef(0), retryKeys = useRef({})
  const canAccess = areas.some(area => !area.Encargado && area.Funciones?.includes('LECTURISTA'))
  const selectedRoute = routes.find(route => String(route.idRutaMedicion) === selectedId) || null
  async function loadData() {
    const ticket = ++request.current; setLoading(true); setError('')
    try {
      const employee = empleadoId ?? idEmpleado ?? await resolveEmpleadoId()
      if (!employee) throw new Error('No se pudo identificar al lecturista.')
      const [catalog, list, motiveList] = await Promise.all([fetchTypes(), fetchRoutes(employee), eventosOperativosApi('/motivos?contexto=LECTURA_NO_REALIZADA')])
      if (ticket !== request.current) return
      setTypes(catalog || []); setRoutes(list || []); setReasons(motiveList || [])
      setSelectedId(current => list?.some(route => String(route.idRutaMedicion) === current) ? current : String(list?.find(route => !['Finalizada','Cancelada','TiempoCaducado'].includes(route.estado))?.idRutaMedicion || list?.[0]?.idRutaMedicion || ''))
    } catch (failure) { if (ticket === request.current) setError(failure.message || 'No se pudo cargar la hoja de ruta.') }
    finally { if (ticket === request.current) setLoading(false) }
  }
  useEffect(() => { if (canAccess) loadData(); return () => { request.current++ } }, [canAccess, empleadoId, idEmpleado])
  function updateRoute(updated) { setRoutes(current => current.map(route => String(route.idRutaMedicion) === String(updated.idRutaMedicion) ? updated : route)) }
  async function selectRoute(route) {
    if (busy) return false
    if (String(route.idRutaMedicion) === selectedId) return true
    if (String(route.idRutaMedicion) !== selectedId && (Object.values(readings).some(value => String(value).trim()) || Object.values(photos).some(Boolean) || Object.values(notes).some(Boolean) || signature)) {
      if (!await confirmAction({ title: 'Cambiar de recorrido', message: 'Hay datos sin guardar en la hoja actual. Se descartarán al cambiar de recorrido.', confirmButtonText: 'Cambiar recorrido', cancelButtonText: 'Seguir aquí', target: alertTarget() })) return false
    }
    setSelectedId(String(route.idRutaMedicion)); setReadings({}); setPhotos({}); setSelectedReasons({}); setNotes({}); setSignature('')
    return true
  }
  async function notify(title, message, type = 'error') { await showInfo({ title, message, type, target: alertTarget() }) }
  async function start() {
    if (!selectedRoute || busy) return false
    setBusy(true)
    try {
      updateRoute(await startRoute(selectedRoute.idRutaMedicion))
      showToast({ title:'Recorrido iniciado',message:'Ya podés completar las lecturas de la hoja.',type:'success' }); return true
    } catch (failure) { await notify('No se pudo iniciar', failure.message); return false }
    finally { setBusy(false) }
  }
  async function saveAllReadings() {
    if (busy || !selectedRoute) return false
    const items=selectedRoute.items.filter(item=>item.estado!=='Medido' && readings[item.idMedidor]!=null && String(readings[item.idMedidor]).trim()!=='')
    if (!items.length) { await notify('No hay lecturas nuevas','Completá al menos una lectura para guardar.','info'); return false }
    const invalid=items.find(item=>!Number.isFinite(Number(readings[item.idMedidor])) || Number(readings[item.idMedidor])<0)
    if(invalid){await notify('Revisá la lectura',`El medidor ${invalid.numeroMedidor || invalid.idMedidor} tiene un valor inválido. Ingresá un número igual o mayor que cero.`,'warning');return false}
    const withoutPhoto=items.find(item=>!photos[item.idMedidor]?.Base64)
    if(withoutPhoto){await notify('Falta la foto del medidor',`Adjuntá la foto del medidor ${withoutPhoto.numeroMedidor || withoutPhoto.idMedidor} antes de guardar las lecturas.`,'warning');return false}
    if(!types[0]?.idTipoLectura){await notify('Falta el tipo de lectura','Actualizá la hoja o consultá al encargado.');return false}
    setBusy(true);let saved=0
    try {
      if(!await confirmAction({title:'Guardar lecturas cargadas',message:`Se guardarán ${items.length} lecturas con sus fotos adjuntas. Los campos vacíos seguirán pendientes.`,confirmButtonText:'Guardar lecturas',target:alertTarget()}))return false
      const employee=empleadoId??idEmpleado??await resolveEmpleadoId()
      if(!employee)throw new Error('No se pudo identificar al lecturista.')
      for(const item of items){
        updateRoute(await saveReading(selectedRoute.idRutaMedicion,item.idMedidor,{idEmpleado:Number(employee),idTipoLectura:Number(types[0].idTipoLectura),fechaLectura:localRouteDate(),lecturaActual:Number(readings[item.idMedidor]),tipoLecturaNombre:types[0].Nombre||types[0].label||'Lectura normal',empleadoUsuario:usuario,empleadoNombre:nombre||usuario,photo:photos[item.idMedidor]||null}))
        saved++;setReadings(current=>({...current,[item.idMedidor]:''}));setPhotos(current=>({...current,[item.idMedidor]:null}))
      }
      showToast({title:'Lecturas guardadas',message:`Se registraron ${saved} lecturas.`,type:'success'});return true
    }catch(failure){await notify('Se detuvo el guardado',`${saved} de ${items.length} lecturas quedaron guardadas. Los datos restantes se conservan en el formulario. ${failure.message}`);return false}finally{setBusy(false)}
  }
  async function onSaveReading(item) {
    if (busy || !selectedRoute) return false
    const value = readings[item.idMedidor]
    if (value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) { await notify('Revisá la lectura', 'Ingresá la lectura real, igual o mayor que cero.', 'warning'); return false }
    if (!photos[item.idMedidor]?.Base64) { await notify('Falta la foto del medidor', 'Adjuntá una imagen donde se vea el número del medidor y su lectura antes de guardar.', 'warning'); return false }
    if (!types[0]?.idTipoLectura) { await notify('Falta configurar el tipo de lectura', 'Actualizá la hoja o consultá al encargado antes de guardar.'); return false }
    setBusy(true)
    try {
      if (!await confirmAction({ title: 'Guardar lectura', message: `Medidor ${item.numeroMedidor || item.idMedidor} · ${item.socioNombre}. Lectura informada: ${value}.`, confirmButtonText: 'Guardar lectura', target: alertTarget() })) return false
      const employee = empleadoId ?? idEmpleado ?? await resolveEmpleadoId()
      const updated = await saveReading(selectedRoute.idRutaMedicion, item.idMedidor, { idEmpleado:Number(employee), idTipoLectura:Number(types[0].idTipoLectura), fechaLectura:localRouteDate(), lecturaActual:Number(value), tipoLecturaNombre:types[0].Nombre || types[0].label || 'Lectura normal', empleadoUsuario:usuario, empleadoNombre:nombre || usuario, photo:photos[item.idMedidor] || null })
      updateRoute(updated); setReadings(current => ({...current, [item.idMedidor]:''})); setPhotos(current => ({...current, [item.idMedidor]:null}))
      await notify('Lectura guardada', 'La visita quedó registrada en esta hoja de ruta.', 'success'); return true
    } catch (failure) { await notify('No se pudo guardar la lectura', failure.message); return false }
    finally { setBusy(false) }
  }
  async function onSaveIssue(item) {
    if (busy || !selectedRoute) return false
    const reason = reasons.find(value => String(value.idMotivoEvento) === String(selectedReasons[item.idMedidor]))
    if (!reason) { await notify('Elegí un motivo', 'Indicá por qué no se pudo registrar la lectura.', 'warning'); return false }
    if (reason.RequiereDetalle && !notes[item.idMedidor]?.trim()) { await notify('Falta el detalle', 'Este motivo requiere una explicación de lo ocurrido.', 'warning'); return false }
    setBusy(true)
    try {
      if (!await confirmAction({ title:'Registrar lectura no realizada', message:`Medidor ${item.numeroMedidor || item.idMedidor}: ${reason.Nombre}. Se registrará como novedad, sin inventar una lectura.`, confirmButtonText:'Registrar novedad', type:'warning', target:alertTarget() })) return false
      const key = `${selectedRoute.idRutaMedicion}:${item.idMedidor}:${reason.idMotivoEvento}`
      retryKeys.current[key] ||= globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
      updateRoute(await saveIssue(selectedRoute.idRutaMedicion, item.idMedidor, { estado:'Observado', idMotivoEvento:Number(reason.idMotivoEvento), operacionId:retryKeys.current[key], observacion:notes[item.idMedidor]?.trim() || '' }))
      delete retryKeys.current[key]; setSelectedReasons(current => ({...current, [item.idMedidor]:''})); setNotes(current => ({...current, [item.idMedidor]:''}))
      setReadings(current=>({...current,[item.idMedidor]:''}));setPhotos(current=>({...current,[item.idMedidor]:null}))
      await notify('Novedad registrada', 'La visita quedó informada con su motivo. No cuenta como lectura realizada.', 'success'); return true
    } catch (failure) { await notify('No se pudo registrar la novedad', failure.message); return false }
    finally { setBusy(false) }
  }
  async function onPhoto(item, file) {
    if (!file) return false
    if (!['image/jpeg','image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) { await notify('Foto inválida', 'Elegí una imagen JPEG o PNG de hasta 2 MB.', 'warning'); return false }
    try { const base64 = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload=()=>resolve(String(reader.result).split(',')[1]); reader.onerror=()=>reject(new Error('No se pudo leer la foto.')); reader.readAsDataURL(file) }); setPhotos(current=>({...current,[item.idMedidor]:{Base64:base64,Nombre:file.name,Tipo:file.type}})); return true }
    catch (failure) { await notify('No se pudo cargar la foto',failure.message); return false }
  }
  async function saveMissingPhoto(item) {
    if(busy || !photos[item.idMedidor]?.Base64)return false
    setBusy(true)
    try {
      if(!await confirmAction({title:'Adjuntar foto a la lectura',message:`Se vinculará la foto al medidor ${item.numeroMedidor || item.idMedidor}. La lectura registrada conservará su valor.`,confirmButtonText:'Guardar foto',target:alertTarget()}))return false
      const photo=photos[item.idMedidor]
      await apiLaboralExistente(`/rutas-medicion/mediciones/${item.idMedicion}/foto`,{method:'POST',body:{FotoBase64:photo.Base64,TipoFoto:photo.Tipo,NombreFoto:photo.Nombre}})
      updateRoute({...selectedRoute,items:selectedRoute.items.map(row=>row.idMedidor===item.idMedidor?{...row,fotoMedidorUrl:`mediciones/${item.idMedicion}/foto`}:row)})
      setPhotos(current=>({...current,[item.idMedidor]:null}));await notify('Foto registrada','El encargado ya puede consultar la imagen.','success');return true
    }catch(failure){await notify('No se pudo adjuntar la foto',failure.message);return false}finally{setBusy(false)}
  }
  async function finish() {
    if (busy || !selectedRoute) return false
    if (!signature || !selectedRoute.items?.length || selectedRoute.items.some(item=>item.estado==='Pendiente')) { await notify('Falta completar el recorrido','Resolvé cada visita y firmá antes de finalizar.','warning'); return false }
    if(selectedRoute.items.some(item=>item.estado==='Medido'&&!item.fotoMedidorUrl?.startsWith('mediciones/'))){await notify('Faltan fotos de las lecturas','Adjuntá las fotos de todas las lecturas realizadas antes de finalizar el recorrido.','warning');return false}
    setBusy(true)
    try { if (!await confirmAction({title:'Finalizar hoja de ruta',message:'Se enviará la hoja con su firma y quedará cerrada para nuevas cargas.',confirmButtonText:'Firmar y finalizar',target:alertTarget()}))return false; updateRoute(await completeRoute(selectedRoute.idRutaMedicion,{firmaDigital:signature})); setSignature(''); await notify('Hoja finalizada','El recorrido quedó cerrado con la firma registrada.','success'); return true }
    catch(failure){await notify('No se pudo finalizar',failure.message);return false}finally{setBusy(false)}
  }
  async function download(item) { try { await descargarApi(`/rutas-medicion/${item.fotoMedidorUrl}`,`medidor-${item.numeroMedidor}.jpg`) } catch(failure){await notify('No se pudo descargar la foto',failure.message)} }
  if(!canAccess)return <p className="card">Esta vista requiere una asignación vigente como lecturista de Agua o Energía.</p>
  if(loading || loadingEmpleado)return <div className="routes-empty" role="status"><Loader2 className="animate-spin"/>Cargando hojas de ruta…</div>
  return <LecturistaRutaView {...{routes,selectedRoute,error,busy,readings,photos,reasons,selectedReasons,notes,signature,setSignature}} onRefresh={loadData} onSelect={selectRoute} onStart={start} onSaveAll={saveAllReadings} onSaveReading={onSaveReading} onSaveIssue={onSaveIssue} onPhoto={onPhoto} onSaveMissingPhoto={saveMissingPhoto} onDownload={download} onFinish={finish} onReading={(id,value)=>setReadings(current=>({...current,[id]:value}))} onReason={(id,value)=>setSelectedReasons(current=>({...current,[id]:value}))} onNote={(id,value)=>setNotes(current=>({...current,[id]:value}))} onRemovePhoto={id=>setPhotos(current=>({...current,[id]:null}))}/>
}
