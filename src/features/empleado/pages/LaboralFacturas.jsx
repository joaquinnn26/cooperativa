import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { apiLaboralExistente, laboralApi } from '@/utils/laboral.js'
import { apiUrl } from '@/config/api.js'
import { linkPagoSeguro } from '@/utils/laboralPermissions.js'
import LaboralFacturacionInternet from './LaboralFacturacionInternet.jsx'
import FacturaOtrosConceptos from '@/components/FacturaOtrosConceptos.jsx'

const mesActual = () => {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
}

export default function LaboralFacturas({ personal = false }) {
  const rol = useAuthStore(s => s.rol)
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodo, setPeriodo] = useState(mesActual)
  const [servicios, setServicios] = useState([])
  const [idServicio, setIdServicio] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [lote, setLote] = useState(null)
  const [intercambioError, setIntercambioError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [incluirAdhesiones, setIncluirAdhesiones] = useState(true)

  useEffect(() => {
    if (personal && rol !== 'Socio') { setLoading(false); return }
    const abort = new AbortController(); setLoading(true); setError('')
    laboralApi(`/facturas?pagina=${page}`, { signal: abort.signal }).then(d => { if (!abort.signal.aborted) setData(d) }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [page, revision, personal, rol])

  useEffect(() => {
    if (personal) return
    const abort = new AbortController()
    apiLaboralExistente('/servicio', { signal: abort.signal }).then(setServicios).catch(e => {
      if (!abort.signal.aborted) setIntercambioError(e.message)
    })
    return () => abort.abort()
  }, [personal])

  async function exportarMediciones() {
    setOcupado(true); setIntercambioError(''); setLote(null)
    try {
      const query = new URLSearchParams()
      if (idServicio) query.set('idServicio', idServicio)
      if (incluirAdhesiones) query.set('incluirAdhesiones', 'true')
      const filtroServicio = query.size ? `?${query}` : ''
      const response = await fetch(apiUrl(`/facturacion/intercambio/exportar/${encodeURIComponent(periodo)}${filtroServicio}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!response.ok) {
        const body = await response.text()
        throw new Error(body || 'No se pudieron exportar las mediciones.')
      }
      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition') || ''
      const filename = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)?.[1] || `mediciones_${periodo}.txt`
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = decodeURIComponent(filename.replace(/"/g, '')); anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { setIntercambioError(e.message) } finally { setOcupado(false) }
  }

  async function validarArchivo() {
    if (!archivo) return
    setOcupado(true); setIntercambioError(''); setLote(null)
    try {
      const contenido = await archivo.text()
      const resultado = await apiLaboralExistente('/facturacion/intercambio/importaciones/validar', {
        method: 'POST', body: { NombreArchivo: archivo.name, Contenido: contenido }
      })
      setLote(resultado)
    } catch (e) { setIntercambioError(e.message) } finally { setOcupado(false) }
  }

  async function aplicarLote() {
    if (!lote?.idLoteImportacion || lote.Estado !== 'Validado') return
    setOcupado(true); setIntercambioError('')
    try {
      const resultado = await apiLaboralExistente(`/facturacion/intercambio/importaciones/${lote.idLoteImportacion}/aplicar`, { method: 'POST' })
      setLote({ ...lote, ...resultado })
      setRevision(r => r + 1)
      setPage(1)
    } catch (e) { setIntercambioError(e.message) } finally { setOcupado(false) }
  }

  if (personal && rol !== 'Socio') return <div className="card m-6"><h1 className="text-2xl font-bold">Mis facturas</h1><p>Ingresá con tu cuenta personal de socio para consultar tus facturas.</p><Link to="/login" className="text-blue-700 underline">Iniciar sesión</Link></div>
  return <div className="space-y-5"><header><h1 className="text-2xl font-bold">{personal ? 'Mis facturas' : 'Facturación externa'}</h1><p className="text-gray-600">{personal ? 'Consultá tus facturas y abrí el enlace de pago proporcionado por la cooperativa.' : 'Consultá facturas y gestioná el intercambio por archivo con el sistema contable.'}</p></header>
    {!personal && <section className="card space-y-4">
      <div><h2 className="font-semibold">Intercambio con el sistema contable</h2><p className="text-sm text-gray-600">Exportá las mediciones de un período. Al recibir el TXT de contabilidad, cargalo para validar las asociaciones antes de crear las facturas.</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">Período de medición<input className="input-field" type="text" maxLength={10} value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="Ej.: 2026-09" /></label>
        <label className="grid gap-1 text-sm">Servicio<select className="input-field" value={idServicio} onChange={e => setIdServicio(e.target.value)}><option value="">Todos los servicios</option>{servicios.map(s => <option key={s.idServicio} value={s.idServicio}>{s.Nombre}</option>)}</select></label>
        <button className="btn-secondary" disabled={ocupado || !periodo.trim()} onClick={exportarMediciones}>{ocupado ? 'Procesando…' : 'Descargar mediciones TXT'}</button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={incluirAdhesiones} onChange={e => setIncluirAdhesiones(e.target.checked)} />Incluir cuotas de Sepelio y Ortopedia (formato SOCIOAPP-2)</label>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t pt-4">
        <label className="grid gap-1 text-sm">Archivo TXT de contabilidad<input className="input-field" type="file" accept=".txt,text/plain" onChange={e => { setArchivo(e.target.files?.[0] || null); setLote(null); setIntercambioError('') }} /></label>
        <button className="btn-secondary" disabled={ocupado || !archivo} onClick={validarArchivo}>{ocupado ? 'Procesando…' : 'Validar archivo'}</button>
      </div>
      {intercambioError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{intercambioError}</p>}
      {lote && <div className={`rounded-lg p-4 text-sm ${lote.Estado === 'Validado' || lote.Estado === 'Aplicado' ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-950'}`}>
        <p className="font-semibold">Lote #{lote.idLoteImportacion} · {lote.Estado}</p>
        <p>{lote.CantidadValidas} de {lote.CantidadFilas} filas válidas{lote.CantidadAplicadas != null ? ` · ${lote.CantidadAplicadas} facturas aplicadas` : ''}</p>
        {!!lote.Errores?.length && <ul className="mt-2 list-disc space-y-1 pl-5">{lote.Errores.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul>}
        {lote.Estado === 'Validado' && <button className="btn-primary mt-3" disabled={ocupado} onClick={aplicarLote}>Aplicar facturas del lote</button>}
      </div>}
      <p className="text-xs text-gray-600">El TXT de respuesta debe conservar las claves del lote exportado. La apertura de un link de pago no confirma el pago; la consulta automática a Mercado Pago aún requiere una integración independiente.</p>
    </section>}
    {!personal && <LaboralFacturacionInternet />}
    {personal && <p className="rounded-lg bg-blue-50 p-3 text-sm">Abrir el enlace no confirma un pago. El estado se actualiza cuando existe una confirmación registrada.</p>}
    <button className="btn-secondary" onClick={() => setRevision(r => r + 1)}>Actualizar consulta</button>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {loading ? <p role="status">Cargando facturas…</p> : !error && <><div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Factura', 'Servicio', 'Importe', 'Vencimiento', 'Estado confirmado', 'Última actualización', 'Pago'].map(x => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{data.items.map(f => <tr key={f.idFactura} className="border-t"><td className="p-3">{f.NumeroFactura ? `N.º ${f.NumeroFactura}` : `Registro #${f.idFactura}`}{f.Periodo && <p>Período {f.Periodo}</p>}{!personal && <p>Socio #{f.idSocio}</p>}</td><td className="p-3">{f.Servicio}<FacturaOtrosConceptos conceptos={f.Conceptos} /></td><td className="p-3">{Number(f.MontoTotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td><td className="p-3">{new Date(f.FechaCaducidad).toLocaleDateString('es-AR')}</td><td className="p-3">{f.EstadoConfirmado || 'Sin confirmación externa'}</td><td className="p-3">{f.FechaActualizacionUtc ? new Date(f.FechaActualizacionUtc).toLocaleString('es-AR') : 'Sin actualización verificable'}{f.Fuente && <p>{f.Fuente}</p>}</td><td className="p-3">{!['Pagada', 'Anulada'].includes(f.EstadoConfirmado) && linkPagoSeguro(f.LinkPago) ? <a className="btn-primary inline-block" href={linkPagoSeguro(f.LinkPago)} target="_blank" rel="noopener noreferrer">Pagar</a> : f.EstadoConfirmado === 'Pagada' ? 'Pago confirmado' : 'Sin enlace disponible'}</td></tr>)}</tbody></table>{!data.total && <p className="p-4">No hay facturas registradas para esta consulta.</p>}</div><div className="flex justify-between"><button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{data.total} facturas · Página {page}</span><button className="btn-secondary" disabled={page * 25 >= data.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></div></>}
  </div>
}
