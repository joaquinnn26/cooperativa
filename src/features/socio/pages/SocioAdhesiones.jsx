import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdhesionForm from '@/components/AdhesionForm.jsx'
import { adhesionLabels, adhesionPayload, nuevaAdhesion, validarAdhesion } from '@/utils/adhesiones.js'
import { apiLaboralExistente as api, archivoPayload, descargarApi } from '@/utils/laboral.js'

const money = amount => Number(amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
export default function SocioAdhesiones() {
  const [catalogo, setCatalogo] = useState({ servicios: [], conexiones: [] })
  const [items, setItems] = useState([])
  const [form, setForm] = useState(nuevaAdhesion)
  const [conexion, setConexion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [corregir, setCorregir] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState({})
  async function load() {
    const [catalog, adhesiones] = await Promise.all([api('/adhesiones/catalogo'), api('/adhesiones/mias')])
    setCatalogo(catalog); setItems(adhesiones); setConexion(old => old || String(catalog.conexiones[0]?.idServicioSocio || ''))
  }
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  async function run(action, message) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(message); await load() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function submit(e) {
    e.preventDefault()
    await run(async () => {
      if (corregir) {
        validarAdhesion(form, { correccion: true })
        const Familiares = form.Sepelio ? await Promise.all(form.Familiares.map(async f => ({ Nombre: f.Nombre.trim(), Documento: f.Documento.trim(), Vinculo: f.Vinculo.trim(), MismoDomicilio: f.MismoDomicilio, ConservaAdhesion: Boolean(f.ConservaAdhesion), Archivo: await archivoPayload(f.archivo) }))) : []
        await api(`/adhesiones/${corregir.idAdhesion}/corregir`, { method: 'POST', body: { Revision: corregir.Revision, Direccion: direccion, Familiares } })
      } else {
        const payload = await adhesionPayload(form, direccion, archivoPayload)
        await api('/adhesiones', { method: 'POST', body: { ...payload, idConexionEnergia: Number(conexion) } })
      }
      setForm(nuevaAdhesion()); setCorregir(null)
    }, 'La adhesión quedó en revisión. Todavía no genera cargos ni habilita prestaciones.')
  }
  const pedido = (id, patch) => setPedidos(old => ({ ...old, [id]: { ...old[id], ...patch } }))
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <header><h1 className="text-3xl font-bold">Sepelio y Ortopedia</h1><p className="mt-2 text-slate-600">Consultá tus adhesiones, las personas cubiertas y los pedidos de atención. Las cuotas fijas aparecen en “Otros servicios / conceptos” de la factura eléctrica.</p></header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-900">{notice}</p>}
    {loading ? <p role="status">Consultando adhesiones…</p> : <>
      {(catalogo.conexiones.length > 0 || corregir) ? <form className="card space-y-4" onSubmit={submit}><h2 className="text-xl font-semibold">{corregir ? `Corregir adhesión #${corregir.idAdhesion}` : 'Adherirme a un servicio adicional'}</h2>
        {!corregir && <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Conexión eléctrica<select className="input-field" required value={conexion} onChange={e => setConexion(e.target.value)}>{catalogo.conexiones.map(c => <option key={c.idServicioSocio} value={c.idServicioSocio}>{c.Servicio} · conexión #{c.idServicioSocio}</option>)}</select></label><label className="grid gap-1 text-sm">Domicilio de cobertura<input className="input-field" required maxLength={200} value={direccion} onChange={e => setDireccion(e.target.value)} /></label></div>}
        {corregir && <label className="grid gap-1 text-sm">Domicilio de cobertura<input className="input-field" required maxLength={200} value={direccion} onChange={e => setDireccion(e.target.value)} /></label>}{corregir && <p>Domicilio: {corregir.Direccion}. {corregir.Tipo === 'SEPELIO' ? 'Volvé a adjuntar los DNI corregidos de todas las personas incluidas.' : 'Confirmá el reenvío de la adhesión para su revisión.'}</p>}
        <AdhesionForm value={form} onChange={setForm} servicios={catalogo.servicios} correccion={Boolean(corregir)} />
        <div className="flex gap-3"><button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : corregir ? 'Enviar corrección' : 'Solicitar adhesión'}</button>{corregir && <button type="button" className="btn-secondary" onClick={() => { setCorregir(null); setForm(nuevaAdhesion()) }}>Cerrar corrección</button>}</div>
      </form> : <p className="card">Podés elegir estos servicios al <Link className="text-blue-700 underline" to="/socio/solicitudes-servicio/nueva">solicitar Energía</Link>. Si ya solicitaste la conexión, esperá su activación para iniciar una adhesión desde esta página.</p>}
      <section className="space-y-4"><h2 className="text-xl font-semibold">Mis adhesiones y cobertura</h2>{!items.length && <p className="card">Todavía no registraste adhesiones. Tener Energía no contrata automáticamente Sepelio ni Ortopedia.</p>}
        {items.map(a => <article className="card space-y-4" key={a.idAdhesion}><div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-semibold">{a.Tipo === 'SEPELIO' ? 'Sepelio' : 'Ortopedia'} · #{a.idAdhesion}</h3><span>{adhesionLabels[a.Estado]}</span></div>
          <p>{a.Direccion} · {a.ImporteMensual != null ? `${money(a.ImporteMensual)} por mes` : 'Sin cargo activo'}</p>{a.Motivo && <p className="rounded-lg bg-amber-50 p-3">{a.Motivo}</p>}
          {a.Familiares.length > 0 && <div><h4 className="font-semibold">Personas incluidas</h4><ul>{a.Familiares.map(f => <li key={f.idBeneficiario} className="flex flex-wrap justify-between gap-2 py-1"><span>{f.Nombre} · {f.Vinculo} · DNI {f.Documento}{!f.MismoDomicilio && ' · Continuidad fuera de la localidad'}</span><button type="button" className="text-blue-700 underline" onClick={() => descargarApi(`/adhesiones/beneficiarios/${f.idBeneficiario}/dni`, f.NombreArchivo).catch(e => setError(e.message))}>Ver DNI</button></li>)}</ul></div>}
          {a.Estado === 'Activa' && !a.CoberturaVigente && <p role="status" className="rounded-lg bg-amber-50 p-3">La cobertura requiere socio activo y un medidor registrado a nombre del titular. Consultá con Administración.</p>}{a.Estado === 'Observada' && <button type="button" className="btn-secondary" onClick={() => { setCorregir(a); setDireccion(a.Direccion); setForm({ ...nuevaAdhesion(), Sepelio: a.Tipo === 'SEPELIO', Ortopedia: a.Tipo === 'ORTOPEDIA', Familiares: a.Familiares.map(f => ({ ...f, archivo: null })) }) }}>Corregir adhesión</button>}
          {['EnRevision', 'Observada', 'Activa'].includes(a.Estado) && <button type="button" className="btn-secondary" disabled={busy} onClick={() => { const Motivo = window.prompt('Motivo de la baja de esta adhesión:'); if (Motivo?.trim()) run(() => api(`/adhesiones/${a.idAdhesion}/accion`, { method: 'POST', body: { Accion: 'Baja', Motivo, Revision: a.Revision } }), 'La baja quedó registrada. No modifica las facturas ya emitidas.') }}>Solicitar baja</button>}
          <details><summary className="cursor-pointer font-medium">Historial de la adhesión</summary><ol className="mt-2 space-y-2">{a.Historial.map((h, i) => <li key={i}>{adhesionLabels[h.Estado]} · {new Date(h.FechaUtc).toLocaleString('es-AR', { timeZone: 'UTC' })} UTC{h.Motivo && ` · ${h.Motivo}`}</li>)}</ol></details>
          {a.Estado === 'Activa' && a.CoberturaVigente && <form className="space-y-3 border-t pt-4" onSubmit={e => { e.preventDefault(); run(async () => { await api(`/adhesiones/${a.idAdhesion}/prestaciones`, { method: 'POST', body: { Detalle: pedidos[a.idAdhesion]?.Detalle, idBeneficiario: Number(pedidos[a.idAdhesion]?.idBeneficiario) || null } }); pedido(a.idAdhesion, { Detalle: '', idBeneficiario: '' }) }, 'El pedido de atención quedó registrado. No crea otra adhesión ni otra cuota.') }}><h4 className="font-semibold">Solicitar una prestación</h4><p className="text-sm text-slate-600">Usá esta opción cuando necesites la atención o un elemento de ortopedia.</p>
            {a.Tipo === 'SEPELIO' && <label className="grid gap-1 text-sm">Persona cubierta<select className="input-field" required value={pedidos[a.idAdhesion]?.idBeneficiario || ''} onChange={e => pedido(a.idAdhesion, { idBeneficiario: e.target.value })}><option value="">Seleccionar persona</option>{a.Familiares.map(f => <option key={f.idBeneficiario} value={f.idBeneficiario}>{f.Nombre}</option>)}</select></label>}
            <label className="grid gap-1 text-sm">Detalle de la atención<textarea className="input-field" required maxLength={1500} value={pedidos[a.idAdhesion]?.Detalle || ''} onChange={e => pedido(a.idAdhesion, { Detalle: e.target.value })} /></label><button className="btn-primary" disabled={busy}>Enviar pedido de atención</button>
          </form>}
          {a.Prestaciones.length > 0 && <div><h4 className="font-semibold">Pedidos de atención</h4>{a.Prestaciones.map(p => <p key={p.idPrestacion} className="mt-2 rounded-lg bg-slate-50 p-3">#{p.idPrestacion} · {p.Estado} · {p.Detalle}{p.Resultado && ` · ${p.Resultado}`}{p.ReferenciaPrestador && ` · Referencia: ${p.ReferenciaPrestador}`}</p>)}</div>}
        </article>)}
      </section>
    </>}
  </main>
}
