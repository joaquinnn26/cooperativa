import React, { useEffect, useState } from 'react'
import { History, Loader2 } from 'lucide-react'
import { meterApi } from '@/utils/meters.js'

export default function MedidorHistorialPreview({ id, disabled }) {
  const [open, setOpen] = useState(false), [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(false), [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!open) return
    const abort = new AbortController(); setLoading(true); setError(''); setData(null)
    meterApi(`/${id}`, { signal: abort.signal }).then(result => { if (!abort.signal.aborted) setData(result) }).catch(failure => { if (!abort.signal.aborted) setError(failure.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [id, open, retry])
  return <div className="meter-work-history"><button type="button" disabled={disabled} aria-expanded={open} onClick={() => setOpen(value => !value)}><History size={16}/>{open ? 'Ocultar historial de uso' : 'Consultar historial del equipo seleccionado'}</button>{open && <div>{loading ? <p role="status"><Loader2 size={16} className="meter-work-spin"/>Cargando historial…</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div> : data && <>{data.asignaciones?.length ? <ol>{data.asignaciones.map(item => <li key={item.idAsignacion}><strong>{item.Servicio} · {item.Cerrada ? 'Retirado' : 'Instalación activa'}</strong><p>{item.FechaInicio ? new Date(item.FechaInicio).toLocaleDateString('es-AR') : 'Inicio no registrado'} → {item.FechaFin ? new Date(item.FechaFin).toLocaleDateString('es-AR') : 'Retiro no registrado'}</p><p>Lecturas: {item.LecturaInicial ?? 'No registrada'} → {item.LecturaFinal ?? 'No registrada'}</p>{item.Origen === 'MigracionSinVerificar' && <small>Registro heredado sin verificación física.</small>}</li>)}</ol> : <p>No tiene asignaciones anteriores registradas.</p>}<small>Historial registrado en el sistema. Verificá la lectura física actual del equipo antes de instalarlo.</small></>}</div>}</div>
}
