import React,{useEffect,useRef} from 'react'
import {Check,FileText,Info,UploadCloud,X} from 'lucide-react'
import {apiUrl} from '@/config/api.js'

export const billingPeriod=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
export const billingMoney=value=>value==null?'Sin informar':Number(value).toLocaleString('es-AR',{style:'currency',currency:'ARS'})
export const billingDate=value=>{const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return match?`${match[3]}/${match[2]}/${match[1]}`:'Sin informar'}
export const billingTarget=()=>[...document.querySelectorAll('dialog[open]')].at(-1)
export async function billingResponseError(response){const raw=await response.text();try{const data=JSON.parse(raw);return typeof data==='string'?data:data.Message||'No se pudo completar la operación.'}catch{return raw||'No se pudo completar la operación.'}}
export async function billingDownload(path,fallback){
 const response=await fetch(apiUrl(path),{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}})
 if(!response.ok)throw new Error(await billingResponseError(response))
 const blob=await response.blob(),header=response.headers.get('Content-Disposition')||''
 const encoded=header.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)?.[1]
 let filename=fallback;try{if(encoded)filename=decodeURIComponent(encoded.replace(/"/g,''))}catch{ /* Usar el nombre de respaldo. */ }
 return {blob,filename}
}
export function saveBillingDownload({blob,filename}){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function BillingDialog({open,title,eyebrow,description,busy,onClose,children,footer}){
 const ref=useRef(null)
 useEffect(()=>{if(!open)return;const modal=ref.current,previous=document.body.style.overflow;if(!modal.open)modal.showModal();document.body.style.overflow='hidden';return()=>{if(modal.open)modal.close();document.body.style.overflow=previous}},[open])
 if(!open)return null
 return <dialog ref={ref} className="bf-dialog" aria-labelledby="bf-dialog-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><header><span className="bf-dialog-icon"><FileText size={26}/></span><div><small>{eyebrow}</small><h2 id="bf-dialog-title">{title}</h2><p>{description}</p></div><button type="button" aria-label="Cerrar ventana" disabled={busy} onClick={onClose}><X size={21}/></button></header><div className="bf-dialog-body" aria-busy={busy}>{children}</div><footer><button type="button" className="bf-secondary" disabled={busy} onClick={onClose}>Cerrar</button>{footer}</footer></dialog>
}
export function BillingSteps({step,labels=['Exportar','Validar respuesta','Cargar facturas'],onStep,busy}){return <nav className="bf-steps" aria-label="Pasos del intercambio">{labels.map((label,i)=><button type="button" key={label} aria-current={step===i?'step':undefined} className={`${step===i?'is-active':''} ${step>i?'is-complete':''}`} disabled={busy||!onStep} onClick={()=>onStep?.(i)}><span>{step>i?<Check size={14}/>:i+1}</span><b>{label}</b></button>)}</nav>}
export function BillingNotice({children,warning=false}){return <div className={`bf-notice ${warning?'is-warning':''}`}><Info size={18}/><div>{children}</div></div>}
export function BillingFile({file,onChange,extension,maxMB,disabled}){
 async function pick(value){onChange(value||null)}
 return <div className={`bf-upload ${file?'has-file':''}`} onDragOver={e=>{e.preventDefault()}} onDrop={e=>{e.preventDefault();if(!disabled)pick(e.dataTransfer.files?.[0])}}><UploadCloud size={32}/><h3>{file?file.name:'Seleccioná el archivo de respuesta'}</h3><p>{file?`${(file.size/1024).toLocaleString('es-AR',{maximumFractionDigits:1})} KB · ${extension.toUpperCase()}`:`Arrastralo aquí o buscalo en tu equipo. ${extension.toUpperCase()} de hasta ${maxMB} MB.`}</p><label className="bf-secondary">{file?'Cambiar archivo':'Elegir archivo'}<input disabled={disabled} type="file" accept={extension} onChange={e=>{pick(e.target.files?.[0]);e.target.value=''}}/></label>{file&&<button type="button" disabled={disabled} className="bf-text-button" onClick={()=>pick(null)}>Quitar archivo</button>}</div>
}
export function BillingResult({result,internet=false}){
 const applied=result.Estado==='Aplicado',valid=result.Estado==='Validado',errors=Array.isArray(result.Errores)?result.Errores:[]
 const validCount=result.CantidadValidas??(valid?result.CantidadFilas:null),appliedCount=result.CantidadAplicadas??(internet&&applied?result.CantidadFacturadas:null)
 return <div className={`bf-result ${applied||valid?'is-valid':'is-error'}`}><small>LOTE #{internet?result.idLote:result.idLoteImportacion}</small><h3>{applied?'Facturas cargadas':valid?'Archivo validado':'Hay datos para corregir'}</h3><p>{applied?(appliedCount!=null?`${appliedCount} facturas creadas.`:'Las facturas del lote ya fueron creadas.'):(validCount!=null&&result.CantidadFilas!=null?`${validCount} filas válidas de ${result.CantidadFilas}.`:'Revisá el resultado de la validación antes de continuar.')}</p>{internet&&result.CantidadFacturadas!=null&&!applied&&<p>{result.CantidadFacturadas} contratos con factura informada.</p>}{internet&&result.CantidadRechazadas!=null&&<p>{result.CantidadRechazadas} contratos rechazados por el sistema externo.</p>}{errors.length>0&&<details open><summary>Ver errores ({errors.length})</summary><ul>{errors.map((error,i)=><li key={i}>{error}</li>)}</ul></details>}</div>
}
