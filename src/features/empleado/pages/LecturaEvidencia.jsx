import React,{useEffect,useState} from 'react'
import {Camera,Loader2,RefreshCw} from 'lucide-react'
import {apiUrl} from '@/config/api.js'

export default function LecturaEvidencia({id,hasPhoto,onReady}){
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false),[reload,setReload]=useState(0),[expanded,setExpanded]=useState(false)
  useEffect(()=>{
    const abort=new AbortController();let objectUrl
    onReady(false);setUrl('');setError('')
    if(!hasPhoto)return()=>abort.abort()
    setLoading(true)
    ;(async()=>{try{
      const response=await fetch(apiUrl(`/laboral/lecturas/${id}/foto`),{signal:abort.signal,headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}})
      if(!response.ok)throw new Error('No se pudo cargar la foto. Verificá tu conexión y reintentá.')
      const blob=await response.blob();if(abort.signal.aborted)return
      objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)
    }catch(e){if(!abort.signal.aborted)setError(e.message)}finally{if(!abort.signal.aborted)setLoading(false)}})()
    return()=>{abort.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)}
  },[id,hasPhoto,reload,onReady])
  return <section className="rr-evidence"><div className="rr-evidence-heading"><h3><Camera size={18}/>Foto de la lectura</h3>{url&&<button type="button" className="rr-secondary" onClick={()=>setExpanded(v=>!v)}>{expanded?'Reducir':'Ampliar'} imagen</button>}</div>{!hasPhoto?<p className="rr-warning">Esta lectura no tiene una foto registrada. No se puede aprobar. Si la hoja sigue abierta, el lecturista puede adjuntarla desde su recorrido.</p>:loading?<p className="rr-description" role="status"><Loader2 size={18} className="rr-spin"/> Cargando foto…</p>:error?<div className="rr-warning" role="alert"><p>{error}</p><button type="button" onClick={()=>setReload(r=>r+1)}><RefreshCw size={15}/>Reintentar</button></div>:url&&<img className={expanded?'is-expanded':''} src={url} alt="Evidencia de la lectura y número del medidor" onLoad={()=>onReady(true)} onError={()=>{onReady(false);setError('No se pudo visualizar la imagen. Reintentá antes de aprobar.')}}/>}</section>
}
