import React, { useEffect, useState } from 'react'
import { apiLaboralExistente as api, descargarApi } from '@/utils/laboral.js'
import { adhesionLabels } from '@/utils/adhesiones.js'

export default function AdminAdhesiones() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')
  const load = async () => setItems(await api('/adhesiones/gestion'))
  useEffect(() => { load().catch(e => setError(e.message)) }, [])
  async function act(a, Accion) {
    const Motivo = Accion === 'Activar' ? 'Documentación y adhesión verificadas por Administración.' : window.prompt('Motivo para informar al socio:')
    if (!Motivo?.trim()) return
    setBusy(true); setError(''); setNotice('')
    try { await api(`/adhesiones/${a.idAdhesion}/accion`, { method: 'POST', body: { Accion, Motivo, Revision: a.Revision } }); await load(); setNotice('Cambio registrado en el historial de la adhesión.') } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function prestacion(p, Accion) {
    const ReferenciaPrestador = Accion === 'Cancelar' ? '' : window.prompt('Referencia de la derivación o respuesta del prestador:')
    if (Accion !== 'Cancelar' && !ReferenciaPrestador?.trim()) return
    const Resultado = window.prompt('Detalle del envío, atención o motivo de cancelación:')
    if (!Resultado?.trim()) return
    setBusy(true); setError('')
    try { await api(`/adhesiones/prestaciones/${p.idPrestacion}/accion`, { method: 'POST', body: { Accion, ReferenciaPrestador, Resultado, Revision: p.Revision } }); await load() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function exportar(a) {
    setBusy(true); setError('')
    try {
      const XLSX = await import('xlsx')
      const filas = a.Familiares.length ? a.Familiares : [{}]
      const sheet = XLSX.utils.json_to_sheet(filas.map(f => ({ Solicitud: a.idAdhesion, Servicio: a.Tipo, NumeroSocio: a.NumeroSocio, Titular: a.Socio, Domicilio: a.Direccion, Beneficiario: f.Nombre || '', DNI: f.Documento || '', Vinculo: f.Vinculo || '', ContinuidadHijoFueraLocalidad: f.ConservaAdhesion && !f.MismoDomicilio ? 'A verificar / declarada' : '', Estado: a.Estado })))
      sheet['!cols'] = [12, 14, 15, 28, 36, 28, 16, 20, 30, 18].map(wch => ({ wch }))
      const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Adhesion')
      XLSX.writeFile(book, `adhesion-${a.Tipo.toLowerCase()}-${a.idAdhesion}.xlsx`)
      setNotice('Excel descargado. Los DNI se descargan por separado. La descarga no envía datos al prestador ni cambia el estado.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-8"><header><h1 className="text-3xl font-bold">Adhesiones a Sepelio y Ortopedia</h1><p className="mt-2 text-slate-600">Revisá la contratación y la cobertura familiar. La activación requiere una conexión eléctrica activa y toma la tarifa configurada del servicio. Los pedidos de atención se gestionan por separado.</p></header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3">{notice}</p>}
    <div className="flex flex-wrap items-end justify-between gap-3"><label className="grid gap-1 text-sm">Estado de adhesión<select className="input-field" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos</option>{Object.entries(adhesionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button type="button" className="btn-secondary" disabled={busy} onClick={() => load().catch(e => setError(e.message))}>Actualizar</button></div>
    {items.filter(a => !filter || a.Estado === filter).map(a => <article key={a.idAdhesion} className="card space-y-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">{a.Tipo} · adhesión #{a.idAdhesion}</h2><span>{adhesionLabels[a.Estado]}</span></div><p>{a.Socio} · socio {a.NumeroSocio} · {a.Direccion}</p><p>{a.ConexionDisponible ? 'Conexión eléctrica activa disponible.' : 'Pendiente de activación de la conexión eléctrica.'}{a.ImporteMensual != null && ` Cuota: ${Number(a.ImporteMensual).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}.`}</p>
      {a.Motivo && <p className="rounded-lg bg-amber-50 p-3">{a.Motivo}</p>}
      {a.Tipo === 'SEPELIO' && <div><h3 className="font-semibold">Personas elegidas para la cobertura</h3><ul>{a.Familiares.map(f => <li className="flex flex-wrap justify-between gap-2 py-1" key={f.idBeneficiario}><span>{f.Nombre} · DNI {f.Documento} · {f.Vinculo}{!f.MismoDomicilio && ' · Verificar continuidad de hijo/a fuera de la localidad'}</span><button type="button" className="text-blue-700 underline" onClick={() => descargarApi(`/adhesiones/beneficiarios/${f.idBeneficiario}/dni`, f.NombreArchivo).catch(e => setError(e.message))}>Revisar DNI</button></li>)}</ul></div>}
      {a.Tipo === 'ORTOPEDIA' && <p className="text-sm text-slate-600">Adhesión sin documentación adicional.</p>}
      <div className="flex flex-wrap gap-2">{a.Estado === 'EnRevision' && <><button className="btn-primary" disabled={busy || !a.ConexionDisponible} onClick={() => act(a, 'Activar')}>Verifiqué el alta · activar adhesión</button><button className="btn-secondary" disabled={busy} onClick={() => act(a, 'Observar')}>Observar</button><button className="btn-secondary" disabled={busy} onClick={() => act(a, 'Rechazar')}>Rechazar</button></>}{a.Estado === 'Activa' && <button className="btn-secondary" disabled={busy} onClick={() => act(a, 'Baja')}>Registrar baja</button>}{['EnRevision', 'Activa'].includes(a.Estado) && <button className="btn-secondary" disabled={busy} onClick={() => exportar(a)}>Descargar Excel para el prestador</button>}</div>
      <details><summary className="cursor-pointer">Historial de adhesión</summary>{a.Historial.map((h, i) => <p key={i} className="mt-2 text-sm">{adhesionLabels[h.Estado]} · {h.Motivo} · {new Date(h.FechaUtc).toLocaleString('es-AR', { timeZone: 'UTC' })} UTC</p>)}</details>
      {a.Prestaciones.map(p => <section key={p.idPrestacion} className="space-y-2 rounded-xl border p-3"><h3 className="font-semibold">Pedido de atención #{p.idPrestacion} · {p.Estado}</h3><p>{p.Detalle}</p>{p.idBeneficiario && <p>Persona cubierta: {a.Familiares.find(f => f.idBeneficiario === p.idBeneficiario)?.Nombre}</p>}<p>{p.ReferenciaPrestador} {p.Resultado}</p><div className="flex flex-wrap gap-2">{p.Estado === 'Recibida' && <button className="btn-primary" disabled={busy} onClick={() => prestacion(p, 'Derivar')}>Registrar derivación al prestador</button>}{p.Estado === 'Derivada' && <button className="btn-primary" disabled={busy} onClick={() => prestacion(p, 'Finalizar')}>Registrar resultado de la atención</button>}{['Recibida', 'Derivada'].includes(p.Estado) && <button className="btn-secondary" disabled={busy} onClick={() => prestacion(p, 'Cancelar')}>Cancelar pedido</button>}</div></section>)}
    </article>)}{!items.length && !error && <p className="card">Todavía no hay adhesiones registradas.</p>}
  </main>
}
