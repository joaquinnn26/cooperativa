import React,{useEffect,useRef,useState} from 'react'
import {Check,Droplets,FileText,Flame,Package,Wifi,X,Zap} from 'lucide-react'
export const requestText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
export const requestClosed=value=>['aprobada','aprobado','rechazada','rechazado','cancelada','cancelado','finalizada','finalizado'].includes(requestText(value))
export const requestDate=value=>value&&!Number.isNaN(new Date(value).getTime())?new Date(value).toLocaleString('es-AR'):'Fecha no disponible'
export const requestStatusClass=value=>['aprobada','aprobado','finalizada','finalizado'].includes(requestText(value))?'is-approved':['rechazada','rechazado','cancelada','cancelado'].includes(requestText(value))?'is-rejected':'is-pending'
export function ServiceIcon({name,size=23}){const value=requestText(name),Icon=/agua/.test(value)?Droplets:/luz|elect|energ/.test(value)?Zap:/internet/.test(value)?Wifi:/gas/.test(value)?Flame:Package;return <Icon size={size}/>}
export function RequestSteps({step,onStep,disabled=false,maxStep=2,minStep=0}){return <nav className="sr-steps" aria-label="Pasos para solicitar un servicio">{['Elegí el servicio','Datos y documentos','Revisá y enviá'].map((title,i)=><button type="button" key={title} aria-current={step===i?'step':undefined} disabled={disabled||i>maxStep||i<minStep} className={`${step===i?'is-current':''} ${step>i?'is-complete':''}`} onClick={()=>onStep(i)}><span>{step>i?<Check size={15}/>:i+1}</span><strong>{title}</strong></button>)}</nav>}
export function RequestModal({title,eyebrow,onClose,children}){
 const ref=useRef(null)
 useEffect(()=>{const modal=ref.current,overflow=document.body.style.overflow;if(!modal.open)modal.showModal();document.body.style.overflow='hidden';return()=>{if(modal.open)modal.close();document.body.style.overflow=overflow}},[])
 return <dialog ref={ref} className="sr-modal" aria-labelledby="sr-modal-title" onCancel={e=>{e.preventDefault();onClose()}}><header><span><FileText size={26}/></span><div><small>{eyebrow}</small><h2 id="sr-modal-title">{title}</h2></div><button type="button" aria-label="Cerrar ventana" onClick={onClose}><X size={21}/></button></header><div className="sr-modal-body">{children}</div><footer><button type="button" className="sr-secondary" onClick={onClose}>Cerrar</button></footer></dialog>
}
export function RequestFilePreview({file,onClose}){
 const [url,setUrl]=useState('')
 useEffect(()=>{const value=URL.createObjectURL(file);setUrl(value);return()=>URL.revokeObjectURL(value)},[file])
 return <RequestModal title="Revisá el archivo adjunto" eyebrow={file.name} onClose={onClose}>{url&&(file.type==='application/pdf'?<iframe className="sr-file-pdf" src={url} title={`Vista previa de ${file.name}`}/>:<img className="sr-file-image" src={url} alt={`Vista previa de ${file.name}`}/>)}<p className="sr-description">Este archivo todavía no fue enviado. Se adjuntará al confirmar la solicitud.</p></RequestModal>
}
export function normalizeSocioRequest(row){return {idSolicitudServicio:row.idSolicitudServicio,idServicio:row.idServicio,servicioNombre:row.Servicio||row.servicioNombre,estado:row.Estado||row.estado,fechaSolicitud:row.FechaSolicitud||row.fechaSolicitud,observaciones:row.Observaciones||row.observaciones,motivoRechazo:row.MotivoRechazo||row.motivoRechazo,documentos:(row.Documentos||row.documentos||[]).map(d=>({id:d.idDocumentoSolicitud??d.id,nombre:d.NombreArchivo||d.nombre,fecha:d.FechaSubida||d.fechaSubida}))}}
