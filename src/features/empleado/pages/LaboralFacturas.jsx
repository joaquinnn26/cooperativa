import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { laboralApi } from '@/utils/laboral.js'
import { linkPagoSeguro } from '@/utils/laboralPermissions.js'

export default function LaboralFacturas({ personal = false }) {
  const rol = useAuthStore(s => s.rol)
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (personal && rol !== 'Socio') { setLoading(false); return }
    const abort = new AbortController(); setLoading(true); setError('')
    laboralApi(`/facturas?pagina=${page}`, { signal: abort.signal }).then(d => { if (!abort.signal.aborted) setData(d) }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [page, revision, personal, rol])
  if (personal && rol !== 'Socio') return <div className="card m-6"><h1 className="text-2xl font-bold">Mis facturas</h1><p>Ingresá con tu cuenta personal de socio para consultar tus facturas.</p><Link to="/login" className="text-blue-700 underline">Iniciar sesión</Link></div>
  return <div className="space-y-5"><header><h1 className="text-2xl font-bold">{personal ? 'Mis facturas' : 'Facturación externa'}</h1><p className="text-gray-600">{personal ? 'Consultá tus facturas y abrí el enlace de pago proporcionado por la cooperativa.' : 'Consulta de las facturas correspondientes a tus permisos de facturación.'}</p></header>
    {!personal && <section className="card space-y-3"><h2 className="font-semibold">Intercambio con el sistema contable</h2><p>Falta confirmar los formatos reales de mediciones y facturas, los identificadores de conexión y el mecanismo de actualización de pagos.</p><div className="flex flex-wrap gap-3"><button disabled className="btn-secondary opacity-60">Exportar mediciones · pendiente de formato</button><button disabled className="btn-secondary opacity-60">Importar facturas · pendiente de formato</button></div><p className="text-sm text-gray-600">La revisión de errores de asociación se habilitará junto con la importación real.</p></section>}
    <p className="p-3 rounded-lg bg-blue-50 text-sm">Abrir el enlace no confirma un pago. Cuando no hay confirmación verificable, se muestra «Sin confirmación externa». La integración para actualizar los estados todavía está pendiente.</p>
    <button className="btn-secondary" onClick={() => setRevision(r => r + 1)}>Actualizar consulta</button>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {loading ? <p role="status">Cargando facturas…</p> : !error && <><div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Factura', 'Servicio', 'Importe', 'Vencimiento', 'Estado confirmado', 'Última actualización', 'Pago'].map(x => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{data.items.map(f => <tr key={f.idFactura} className="border-t"><td className="p-3">Registro #{f.idFactura}{!personal && <p>Socio #{f.idSocio}</p>}</td><td className="p-3">{f.Servicio}</td><td className="p-3">{Number(f.MontoTotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td><td className="p-3">{new Date(f.FechaCaducidad).toLocaleDateString('es-AR')}</td><td className="p-3">{f.EstadoConfirmado || 'Sin confirmación externa'}</td><td className="p-3">{f.FechaActualizacionUtc ? new Date(f.FechaActualizacionUtc).toLocaleString('es-AR') : 'Sin actualización verificable'}{f.Fuente && <p>{f.Fuente}</p>}</td><td className="p-3">{!['Pagada', 'Anulada'].includes(f.EstadoConfirmado) && linkPagoSeguro(f.LinkPago) ? <a className="btn-primary inline-block" href={linkPagoSeguro(f.LinkPago)} target="_blank" rel="noopener noreferrer">Pagar</a> : f.EstadoConfirmado === 'Pagada' ? 'Pago confirmado' : 'Sin enlace disponible'}</td></tr>)}</tbody></table>{!data.total && <p className="p-4">No hay facturas registradas para esta consulta.</p>}</div><div className="flex justify-between"><button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{data.total} facturas · Página {page}</span><button className="btn-secondary" disabled={page * 25 >= data.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></div></>}
  </div>
}
