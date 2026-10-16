import React, { useEffect, useState } from 'react'
import { ArrowLeft, FileSignature, MapPinned, Play, RefreshCw } from 'lucide-react'
import { routeDateLabel, routeNumbers, routeText } from './recorridosUtils.js'
import { LecturistaCierreDialog, LecturistaHojasDialog } from './LecturistaRutaDialogs.jsx'
import LecturistaRecorridoForm from './LecturistaRecorridoForm.jsx'
import './LecturistaRuta.css'

export default function LecturistaRutaView(props) {
  const {routes,selectedRoute:route,error,busy,onRefresh,onSelect,onStart,onFinish,signature,setSignature}=props
  const [choose,setChoose]=useState(false),[working,setWorking]=useState(false),[closing,setClosing]=useState(false)
  useEffect(()=>{setWorking(false);setClosing(false)},[route?.idRutaMedicion])
  const n=routeNumbers(route||{}),pending=(route?.items||[]).filter(item=>item.estado==='Pendiente').length
  const closed=!route || ['Finalizada','Cancelada','TiempoCaducado','Caducada'].includes(route.estado)
  const areaLabel=route?.items?.some(item=>routeText(item.tipoMedidor||item.servicioNombre).includes('agua'))?'Agua potable':'Redes de Energía'
  async function openForm(){if(busy)return;if(route.estado==='Pendiente'){if(!await onStart())return}setWorking(true)}
  return <div className="reader-route"><header className="reader-hero"><div><small><MapPinned size={16}/>HOJA DE RUTA{route&&` · ${areaLabel}`}</small><h1>{working?'Carga de lecturas':'Mi recorrido'}</h1><p>{working?'Completá las lecturas de esta hoja y guardá los datos cargados.':'Elegí tu recorrido e inicialo para abrir el formulario con todos sus medidores.'}</p></div>{routes.length>1&&<button type="button" className="btn-secondary" disabled={busy} onClick={()=>setChoose(true)}><MapPinned size={17}/>Cambiar recorrido</button>}</header>
    {error&&<div className="reader-empty" role="alert"><h2>No se pudieron cargar las hojas</h2><p>{error}</p><button type="button" className="btn-primary" onClick={onRefresh}>Reintentar</button></div>}
    {!error&&!route&&<div className="reader-empty"><MapPinned size={36}/><h2>Todavía no tenés recorridos asignados</h2><p>El encargado debe asignarte una hoja para comenzar.</p><button type="button" className="btn-secondary" onClick={onRefresh}><RefreshCw size={16}/>Actualizar</button></div>}
    {!error&&route&&<>{!working?<section className="reader-overview reader-route-welcome"><span className="reader-route-state">{route.estado}</span><h2>{route.nombre}</h2><p>{routeDateLabel(route.fecha)} · {route.empleadoNombre || 'Recorrido asignado a tu usuario'}</p><div className="reader-welcome-counts"><div><strong>{n.total}</strong><span>Medidores del recorrido</span></div><div><strong>{n.measured}</strong><span>Lecturas guardadas</span></div><div><strong>{pending}</strong><span>Pendientes</span></div></div>{n.incidents>0&&<p>{n.incidents} novedades registradas sin lectura.</p>}{route.fechaCaducidadUtc&&!['Finalizada','Cancelada'].includes(route.estado)&&<small>Vencimiento: {new Date(route.fechaCaducidadUtc).toLocaleString('es-AR')}</small>}<div className="reader-welcome-action"><p>{closed?'Podés consultar los resultados de esta hoja.':'Al abrir el formulario verás todos los medidores, en el orden asignado por el encargado.'}</p><button type="button" className="btn-primary" disabled={busy} onClick={openForm}><Play size={17}/>{busy?'Iniciando…':closed?'Ver lecturas del recorrido':route.estado==='Pendiente'?'Iniciar recorrido':'Continuar recorrido'}</button></div></section>:<><div className="reader-form-heading"><button type="button" className="btn-secondary" disabled={busy} onClick={()=>setWorking(false)}><ArrowLeft size={16}/>Volver al recorrido</button><div><h2>{route.nombre}</h2><p>{n.measured} lecturas guardadas · {n.incidents} novedades · {pending} pendientes</p></div></div><LecturistaRecorridoForm {...props} route={route} locked={closed||route.estado==='Pendiente'} onSign={()=>setClosing(true)}/></>}
      {route.estado==='Finalizada'&&route.firmaDigital&&<details className="reader-finished-signature"><summary>Ver firma registrada al finalizar</summary><img src={route.firmaDigital} alt="Firma registrada del lecturista"/></details>}</>}
    {choose&&<LecturistaHojasDialog routes={routes} selectedId={route?.idRutaMedicion} busy={busy} onSelect={onSelect} onClose={()=>setChoose(false)}/>}
    {closing&&route&&<LecturistaCierreDialog route={route} signature={signature} setSignature={setSignature} busy={busy} onFinish={onFinish} onClose={()=>setClosing(false)}/>}
  </div>
}
