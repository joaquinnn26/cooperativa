import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { eventosOperativosApi } from '@/utils/eventosOperativosApi.js'

const label = value => String(value || '').replace(/[_-]+/g, ' ').toLocaleLowerCase('es-AR').replace(/^./, c => c.toLocaleUpperCase('es-AR'))

export default function AdminMotivosEventos() {
  const [catalogs, setCatalogs] = useState([])
  const [context, setContext] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const loadCatalogs = useCallback(async () => {
    try { const values = await eventosOperativosApi('/catalogos'); setCatalogs(values || []); if (!context && values?.length) setContext(values[0].Contexto) } catch (e) { setError(e.message || 'No se pudieron consultar los catálogos.') }
  }, [context])
  const loadItems = useCallback(async () => {
    if (!context) return
    setLoading(true); setError('')
    try { setItems(await eventosOperativosApi(`/motivos?contexto=${encodeURIComponent(context)}&incluirPendientes=true&incluirInactivos=true`) || []) } catch (e) { setError(e.message || 'No se pudo consultar este catálogo.') } finally { setLoading(false) }
  }, [context])
  useEffect(() => { loadCatalogs() }, [])
  useEffect(() => { loadItems() }, [loadItems])
  async function update(item, changes) {
    setSaving(String(item.idMotivoEvento)); setError(''); setNotice('')
    try { await eventosOperativosApi(`/motivos/${item.idMotivoEvento}`, { method: 'PUT', body: JSON.stringify({ ...item, ...changes }) }); setNotice('Se actualizó la opción. Los registros históricos se conservaron.'); await loadItems() } catch (e) { setError(e.message || 'No se pudo actualizar el catálogo.') } finally { setSaving('') }
  }
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <header className="rounded-3xl bg-gradient-to-r from-slate-950 to-blue-900 p-7 text-white"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Administración</p><h1 className="mt-2 text-3xl font-bold">Catálogo de motivos operativos</h1><p className="mt-2 max-w-3xl text-sm text-blue-100">Los motivos son específicos de cada proceso. El texto y el contexto son inmutables; desactivá opciones en desuso para conservar sus referencias históricas.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{notice}</p>}
    <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><label className="grid gap-1 text-sm font-semibold">Proceso<select className="input-field min-w-72" value={context} onChange={e => setContext(e.target.value)}>{catalogs.map(x => <option key={x.Contexto} value={x.Contexto}>{label(x.Contexto)} · {x.Total}</option>)}</select></label><button onClick={() => { loadCatalogs(); loadItems() }} disabled={loading} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15}/>Actualizar</button></div>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950"><AlertTriangle size={17} className="mt-0.5 shrink-0"/>Las opciones heredadas están marcadas como pendientes de validación. No se fusionaron motivos parecidos ni se reinterpretaron textos históricos.</p>
      {loading ? <p className="py-8 text-center text-slate-600">Cargando catálogo…</p> : !items.length ? <p className="py-8 text-center text-slate-600">Este proceso todavía no tiene motivos registrados.</p> : <div className="mt-5 space-y-3">{items.map(item => <article key={item.idMotivoEvento} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.Nombre}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{item.Codigo}</span><span className={`rounded-full px-2 py-1 text-xs ${item.ConfirmadoCooperativa ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>{item.ConfirmadoCooperativa ? 'Validado' : 'Pendiente de validar'}</span>{!item.Activo && <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">Inactivo</span>}</div><p className="mt-1 text-xs text-slate-500">Origen: {item.Origen} · Referencia histórica #{item.idMotivoEvento}</p></div><div className="flex flex-wrap gap-2">{!item.ConfirmadoCooperativa && <button disabled={!!saving} onClick={() => update(item, { ConfirmadoCooperativa: true })} className="btn-secondary">Validar opción</button>}<button disabled={!!saving} onClick={() => update(item, { Activo: !item.Activo })} className={item.Activo ? 'btn-secondary text-red-700' : 'btn-secondary text-emerald-700'}>{item.Activo ? 'Desactivar' : 'Reactivar'}</button></div></article>)}</div>}
    </section>
  </main>
}
