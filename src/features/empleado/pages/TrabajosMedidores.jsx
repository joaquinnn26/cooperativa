import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { meterApi, physicalStates } from '@/utils/meters.js'
import TrabajoMedidorDialog from './TrabajoMedidorDialog.jsx'

export default function TrabajosMedidores({ admin }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [work, setWork] = useState(null)
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError('')
    const timer = setTimeout(() => meterApi(`?estado=Instalados&pagina=${page}&q=${encodeURIComponent(q)}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setData(result) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) }), 250)
    return () => { abort.abort(); clearTimeout(timer) }
  }, [page, q, revision])
  async function confirm(payload) {
    await meterApi(`/${work.meter.idMedidor}/${work.retirar ? 'eventos' : 'reemplazar'}`, { method: 'POST', body: JSON.stringify(payload) })
    setNotice(work.retirar ? 'Retiro registrado. El medidor conserva su historial.' : 'Reemplazo registrado. El nuevo equipo quedó instalado y el anterior conserva su historial.')
    setRevision(r => r + 1)
  }
  return <section className="space-y-4">
    <div><h2 className="text-xl font-bold">Reemplazos y retiros</h2><p className="text-gray-600">Buscá al socio y verificá el servicio, domicilio y número del medidor antes de registrar el trabajo realizado.</p></div>
    <label className="block">Buscar socio, medidor, domicilio, ruta o folio<input className="input-field mt-1" maxLength={100} value={q} onChange={e => { setQ(e.target.value); setPage(1) }} /></label>
    {notice && <p role="status" className="p-3 rounded-lg bg-green-50 text-green-800">{notice}</p>}
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {loading ? <p role="status">Cargando medidores instalados…</p> : !error && <>
      {data.items.map(m => <article key={m.idMedidor} className="card space-y-3"><div><h3 className="font-semibold">{m.Socio || 'Socio sin nombre'} · {m.Servicio}</h3><p className="text-sm text-gray-600">{m.Direccion || 'Domicilio no informado'} · Conexión #{m.idServicioSocio}</p></div>
        <p>Medidor <strong>{m.Numero}</strong> · {physicalStates[m.EstadoFisico]}</p>
        {m.PendienteConciliacion && <p className="text-amber-800">Hay asignaciones anteriores por revisar. Confirmá los datos en el inventario antes de reemplazar.</p>}
        <div className="flex gap-3 flex-wrap"><button className="btn-primary" disabled={m.PendienteConciliacion} onClick={() => setWork({ meter: m, retirar: false })}>Reemplazar medidor</button><button className="btn-secondary" onClick={() => setWork({ meter: m, retirar: true })}>Registrar retiro</button><Link className="text-blue-700 underline self-center" to={`${admin ? '/admin' : '/empleado'}/medidores?medidor=${m.idMedidor}`}>Ver historial</Link></div>
      </article>)}
      {!data.total && <p>No hay medidores instalados para esta búsqueda.</p>}
      <div className="flex justify-between items-center"><button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{data.total} instalados · Página {page}</span><button className="btn-secondary" disabled={page * 25 >= data.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>
    </>}
    {work && <TrabajoMedidorDialog anterior={work.meter} retirar={work.retirar} onClose={() => setWork(null)} onConfirm={confirm} />}
  </section>
}
