import React, { useEffect, useState } from 'react'
import DocumentoAltaPreview from '@/features/admin/components/DocumentoAltaPreview.jsx'
import { altaSocioApi } from '@/utils/altaSocioApi.js'
import { estadosAlta, requisitosAlta, documentosAltaCompletos } from '@/utils/altaSocio.js'

export default function AdminAltasSocio() {
  const [rows,setRows] = useState([]), [reasons,setReasons] = useState([]), [selected,setSelected] = useState(null), [detail,setDetail] = useState(null), [reason,setReason] = useState(''), [error,setError] = useState(''), [busy,setBusy] = useState(false), [revision,setRevision] = useState(0), [filter,setFilter] = useState('EnRevision')
  useEffect(() => {
    const abort = new AbortController()
    setReasons([])
    setReason('')
    altaSocioApi('', { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setRows(result) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
    altaSocioApi('/motivos', { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setReasons(result) })
      .catch(e => { if (!abort.signal.aborted) setError(`No se pudo cargar el catálogo de motivos. Podés consultar las solicitudes; para rechazar, reintentá con Actualizar. ${e.message}`) })
    return () => abort.abort()
  }, [revision])
  async function open(row){if(busy)return;setBusy(true);setSelected(row);setDetail(null);setError('');setReason('');try{setDetail(await altaSocioApi(`/${row.idUsuarioSistema}`))}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function decide(approve){if(busy || detail?.tramite?.Estado !== 'EnRevision' || (approve && !documentosAltaCompletos(detail.documentos)) || (!approve && !reasons.some(m=>m.Codigo===reason)))return;setBusy(true);setError('');try{await altaSocioApi(`/${selected.idUsuarioSistema}/decision`,{method:'POST',body:JSON.stringify({Aprobar:approve,Motivo:approve?null:reason,Version:detail.tramite.Version})});setSelected(null);setDetail(null);setRevision(v=>v+1)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div className="space-y-5"><header><h1 className="text-2xl font-bold">Altas de socios</h1><p className="text-gray-600">Revisá documentos, aprobá el alta o elegí un motivo de rechazo.</p></header><div className="flex flex-wrap gap-3"><label>Estado<select className="input-field" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todos</option>{Object.entries(estadosAlta).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="btn-secondary" disabled={busy} onClick={()=>{setError('');setSelected(null);setDetail(null);setRevision(v=>v+1)}}>Actualizar</button></div>{error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}<div className="grid gap-3 md:grid-cols-2">{rows.filter(r=>!filter || r.Estado===filter).map(r=><article className="card" key={r.idUsuarioSistema}><h2 className="font-semibold">{r.Nombre} {r.Apellido}</h2><p>{r.Documento} · {r.Email}</p><p className="my-2">{estadosAlta[r.Estado]||r.Estado}</p><button className="btn-secondary" disabled={busy} onClick={()=>open(r)}>Revisar</button></article>)}</div>{selected&&<section className="card space-y-4"><h2 className="text-xl font-semibold">{selected.Nombre} {selected.Apellido}</h2><p>DNI {selected.Documento} · {selected.Calle} {selected.Numero} · Titular: {selected.EsTitular?'Sí':'No'}</p>{!detail?<p>{busy ? 'Cargando documentos...' : 'No se pudo cargar el detalle. Seleccione el tramite nuevamente.'}</p>:<><p>Estado: {estadosAlta[detail.tramite.Estado]}</p><div className="grid gap-3 md:grid-cols-3">{requisitosAlta.map(req=>{const d=detail.documentos.find(x=>x.Tipo===req.tipo);return <article className="rounded-lg border p-3" key={req.tipo}><h3 className="font-semibold">{req.nombre}</h3>{d?<><p>{d.Estado}</p><DocumentoAltaPreview documento={d} titulo={req.nombre} /></>:<p>Pendiente</p>}</article>})}</div>{detail.tramite.Estado==='EnRevision'&&<><label>Motivo de rechazo<select disabled={busy} className="input-field mt-1" value={reason} onChange={e=>setReason(e.target.value)}><option value="">Seleccionar motivo</option>{reasons.map(m=><option key={m.Codigo} value={m.Codigo}>{m.Nombre}</option>)}</select></label><div className="flex gap-3"><button className="btn-primary" disabled={busy||!documentosAltaCompletos(detail.documentos)} onClick={()=>decide(true)}>Aprobar alta</button><button className="btn-secondary" disabled={busy||!reason} onClick={()=>decide(false)}>Rechazar</button></div></>}</>}</section>}</div>
}
