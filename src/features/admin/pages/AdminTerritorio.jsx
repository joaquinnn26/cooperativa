import React, { useEffect, useRef, useState } from 'react'
import { apiUrl } from '@/config/api.js'
import { territoryPayload, territoryRequest } from '@/utils/territory.js'

const tabs = { zonas: 'Zonas', barrios: 'Barrios', conexiones: 'Conexiones', historial: 'Historial' }
const emptyResult = { items: [], total: 0 }

export default function AdminTerritorio() {
  const [tab, setTab] = useState('conexiones')
  const [catalogs, setCatalogs] = useState({ zonas: [], barrios: [] })
  const [result, setResult] = useState(emptyResult)
  const [filters, setFilters] = useState({ zona: '', barrio: '', localidad: '', ambito: '', ruta: '', folio: '', pendientes: false, q: '', entidad: '', usuario: '', desde: '', hasta: '' })
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const dialog = useRef(null)
  const request = (path, options) => territoryRequest(apiUrl(`/territorio/${path}`), { token: localStorage.getItem('token'), ...options })

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ pagina: String(page) })
        if (tab === 'conexiones') {
          for (const key of ['zona', 'barrio', 'localidad', 'ambito', 'ruta', 'folio', 'q']) if (filters[key]) query.set(key, filters[key])
          if (filters.pendientes) query.set('pendientes', 'true')
        }
        if (tab === 'historial') {
          for (const key of ['entidad', 'usuario']) if (filters[key]) query.set(key, filters[key])
          if (filters.desde) query.set('desde', new Date(`${filters.desde}T00:00:00`).toISOString())
          if (filters.hasta) {
            const end = new Date(`${filters.hasta}T00:00:00`)
            end.setDate(end.getDate() + 1)
            query.set('hasta', end.toISOString())
          }
        }
        const [data, rows] = await Promise.all([
          request('catalogos', { signal: controller.signal }),
          ['conexiones', 'historial'].includes(tab) ? request(`${tab}?${query}`, { signal: controller.signal }) : Promise.resolve(emptyResult)
        ])
        if (!controller.signal.aborted) { setCatalogs(data); setResult(rows) }
      } catch (err) {
        if (!controller.signal.aborted) { setError(err.message); setResult(emptyResult) }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [tab, page, filters, revision])

  useEffect(() => {
    if (form && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [form])

  const filter = (key, value) => { setFilters(old => ({ ...old, [key]: value, ...(key === 'zona' ? { barrio: '' } : {}) })); setPage(1) }
  const openForm = (kind, row = {}) => {
    setFormError('')
    setForm({ kind, Id: row.Id ?? row.idServicioSocio, Nombre: row.Nombre ?? '', Activo: row.Activo ?? true,
      idZona: row.idZona ?? '', idBarrio: row.idBarrio ?? '', Direccion: row.Direccion ?? '', Version: row.Version ?? null,
      Localidad: row.Localidad ?? '', Ambito: row.Ambito ?? '', Ruta: row.Ruta ?? '', Folio: row.Folio ?? '',
      Motivo: '', description: row.Socio ? `${row.Socio} · ${row.Servicio} · Conexión #${row.idServicioSocio}` : '' })
  }
  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setFormError(''); setNotice('')
    try {
      const payload = territoryPayload(form)
      setSaving(true)
      await request(`${form.kind}${form.Id ? `/${form.Id}` : ''}`, { method: form.Id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      setForm(null); setNotice('Cambio guardado y registrado en el historial.'); setRevision(value => value + 1)
    } catch (err) { setFormError(err.message) } finally { setSaving(false) }
  }
  const changeForm = (key, value) => setForm(old => ({ ...old, [key]: value }))
  const filteredCatalog = (catalogs[tab] || []).filter(row =>
    row.Nombre.toLocaleLowerCase('es').includes(filters.q.toLocaleLowerCase('es')) &&
    (tab !== 'barrios' || !filters.zona || String(row.idZona) === filters.zona))
  const rows = ['zonas', 'barrios'].includes(tab) ? filteredCatalog.slice((page - 1) * 25, page * 25) : result.items
  const total = ['zonas', 'barrios'].includes(tab) ? filteredCatalog.length : result.total
  const pages = Math.max(1, Math.ceil(total / 25))
  const zoneName = id => catalogs.zonas.find(zone => zone.Id === id)?.Nombre || 'Sin zona'
  const selectZones = catalogs.zonas.filter(zone => zone.Activo || zone.Id === Number(form?.idZona))

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Conexiones y territorio</h1><p className="text-gray-600 mt-1">Ubicación urbana o rural, localidad, ruta y folio de cada conexión. Zonas y barrios son referencias opcionales.</p></div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Gestión territorial">
      {Object.entries(tabs).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key}
        className={`px-4 py-2 rounded-lg ${tab === key ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        onClick={() => { setTab(key); setPage(1); setNotice('') }}>{label}</button>)}
    </div>
    {notice && <p role="status" className="p-3 rounded-lg bg-green-50 text-green-800">{notice}</p>}
    <section className="card space-y-4" aria-label={tabs[tab]}>
      <div className="flex flex-wrap items-end gap-4">
        {tab !== 'historial' && <label className="flex-1 min-w-48">Buscar<input className="input-field mt-1" maxLength={100} value={filters.q} onChange={e => filter('q', e.target.value)} placeholder={tab === 'conexiones' ? 'Socio, servicio, dirección o número' : 'Nombre'} /></label>}
        {['barrios', 'conexiones'].includes(tab) && <label>Zona<select className="input-field mt-1" value={filters.zona} onChange={e => filter('zona', e.target.value)}><option value="">Todas</option>{catalogs.zonas.map(zone => <option key={zone.Id} value={zone.Id}>{zone.Nombre}{!zone.Activo && ' (inactiva)'}</option>)}</select></label>}
        {tab === 'conexiones' && <>
          <label>Localidad<input className="input-field mt-1" maxLength={100} value={filters.localidad} onChange={e => filter('localidad', e.target.value)} /></label>
          <label>Ámbito<select className="input-field mt-1" value={filters.ambito} onChange={e => filter('ambito', e.target.value)}><option value="">Todos</option><option>Urbano</option><option>Rural</option></select></label>
          {['ruta', 'folio'].map(key => <label key={key}>{key === 'ruta' ? 'Ruta' : 'Folio'}<input className="input-field mt-1" maxLength={30} value={filters[key]} onChange={e => filter(key, e.target.value)} /></label>)}
          <label>Barrio<select className="input-field mt-1" value={filters.barrio} onChange={e => filter('barrio', e.target.value)}><option value="">Todos</option>{catalogs.barrios.filter(b => !filters.zona || String(b.idZona) === filters.zona).map(b => <option key={b.Id} value={b.Id}>{b.Nombre}{!b.Activo && ' (inactivo)'}</option>)}</select></label>
          <label className="py-3"><input type="checkbox" checked={filters.pendientes} onChange={e => filter('pendientes', e.target.checked)} /> Solo pendientes de ubicación</label>
        </>}
        {tab === 'historial' && <>
          <label>Entidad<select className="input-field mt-1" value={filters.entidad} onChange={e => filter('entidad', e.target.value)}><option value="">Todas</option><option>Zona</option><option>Barrio</option><option value="UbicacionServicio">Ubicación de servicio</option></select></label>
          <label>Usuario (ID)<input className="input-field mt-1" type="number" min="1" value={filters.usuario} onChange={e => filter('usuario', e.target.value)} /></label>
          <label>Desde<input className="input-field mt-1" type="date" value={filters.desde} onChange={e => filter('desde', e.target.value)} /></label>
          <label>Hasta<input className="input-field mt-1" type="date" min={filters.desde} value={filters.hasta} onChange={e => filter('hasta', e.target.value)} /></label>
        </>}
        {['zonas', 'barrios'].includes(tab) && <button className="btn-primary disabled:opacity-50" disabled={loading || !!error} onClick={() => openForm(tab)}>Crear {tab === 'zonas' ? 'zona' : 'barrio'}</button>}
        <button className="btn-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Actualizar</button>
      </div>
      {tab === 'conexiones' && <p className="text-sm text-gray-600">Se admite una dirección o referencia rural sin barrio. Los datos oficiales faltantes quedan pendientes; ruta y folio conservan sus ceros iniciales.</p>}
      {tab === 'historial' && <p className="text-sm text-gray-600">Movimientos territoriales registrados desde la incorporación de este módulo. Fechas mostradas en tu hora local.</p>}
      {error ? <p role="alert" className="bg-red-50 text-red-800 p-4 rounded-lg">{error}</p> : loading ? <p role="status">Cargando información…</p> : <>
        <p className="text-sm text-gray-600">{total} registros</p>
        {!rows.length ? <p className="py-8 text-center text-gray-500">No hay registros para esta selección.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="bg-gray-50"><tr>
            {(['zonas', 'barrios'].includes(tab) ? ['Nombre', ...(tab === 'barrios' ? ['Zona'] : []), 'Estado', 'Acciones'] : tab === 'conexiones'
              ? ['Conexión / socio', 'Servicio', 'Ubicación / ruta / folio', 'Barrio / zona', 'Estado', 'Acciones']
              : ['Fecha / responsable', 'Registro', 'Acción / motivo', 'Cambios']).map(label => <th className="p-3" key={label}>{label}</th>)}
          </tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.Id ?? row.idServicioSocio ?? row.idHistorial}>
            {['zonas', 'barrios'].includes(tab) ? <><td className="p-3 font-medium">{row.Nombre}</td>{tab === 'barrios' && <td className="p-3">{zoneName(row.idZona)}</td>}<td className="p-3">{row.Activo ? 'Activo' : 'Inactivo'}</td><td className="p-3"><button className="text-blue-700 underline" onClick={() => openForm(tab, row)}>Editar {row.Nombre}</button></td></>
            : tab === 'conexiones' ? <><td className="p-3">#{row.idServicioSocio}<br />{row.Socio}<br /><span className="text-gray-500">{row.NumeroSocio ? `Socio Nº ${row.NumeroSocio}` : `ID interno ${row.idSocio} · Nº oficial pendiente`}</span></td><td className="p-3">{row.Servicio}</td><td className="p-3">{row.Direccion || 'Pendiente de completar'}<br />{row.Localidad || 'Localidad pendiente'} · {row.Ambito || 'Ámbito pendiente'}<br />Ruta: {row.Ruta || 'Pendiente'} · Folio: {row.Folio || 'Pendiente'}</td><td className="p-3">{row.Barrio || 'Sin barrio'}<br />{row.Zona || 'Sin zona'}</td><td className="p-3">{row.Activo ? 'Activo' : 'Inactivo'}</td><td className="p-3"><button className="text-blue-700 underline" onClick={() => openForm('conexiones', row)}>Ubicar conexión #{row.idServicioSocio}</button></td></>
            : <><td className="p-3">{new Date(row.FechaUtc).toLocaleString('es-AR')}<br />{row.Usuario} (#{row.idUsuarioSistema})</td><td className="p-3">{row.Entidad} #{row.idEntidad}</td><td className="p-3">{row.Accion}<br />{row.Motivo}</td><td className="p-3"><details><summary className="cursor-pointer text-blue-700">Ver cambios</summary><HistoryValues title="Anterior" value={row.Anterior} /><HistoryValues title="Nuevo" value={row.Nuevo} /></details></td></>}
          </tr>)}</tbody></table></div>}
        <div className="flex justify-between items-center gap-3"><button className="btn-secondary disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page} de {pages}</span><button className="btn-secondary disabled:opacity-50" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>
      </>}
    </section>
    {form && <dialog ref={dialog} aria-labelledby="territory-dialog-title" className="rounded-xl p-6 w-full max-w-lg backdrop:bg-black/40" onCancel={event => { if (saving) event.preventDefault(); else setForm(null) }}>
      <form onSubmit={save} className="space-y-4">
        <h2 id="territory-dialog-title" className="text-xl font-bold">{form.kind === 'conexiones' ? 'Ubicar conexión' : `${form.Id ? 'Editar' : 'Crear'} ${form.kind === 'zonas' ? 'zona' : 'barrio'}`}</h2>
        {form.description && <p>{form.description}</p>}
        <fieldset disabled={saving} className="space-y-4">
          {form.kind === 'conexiones' ? <>
            <label className="block">Dirección o referencia rural<input autoFocus required maxLength={250} className="input-field mt-1" value={form.Direccion} onChange={e => changeForm('Direccion', e.target.value)} /></label>
            <label className="block">Localidad / jurisdicción<input required maxLength={100} className="input-field mt-1" value={form.Localidad} onChange={e => changeForm('Localidad', e.target.value)} list="localidades-conocidas" /></label>
            <datalist id="localidades-conocidas"><option value="Rancul" /><option value="Chamaicó" /><option value="Parera" /></datalist>
            <label className="block">Ámbito<select required className="input-field mt-1" value={form.Ambito} onChange={e => changeForm('Ambito', e.target.value)}><option value="">Seleccionar</option><option>Urbano</option><option>Rural</option></select></label>
            <div className="grid grid-cols-2 gap-3">{['Ruta', 'Folio'].map(key => <label key={key}>{key}<input className="input-field mt-1" maxLength={30} value={form[key]} onChange={e => changeForm(key, e.target.value)} /></label>)}</div>
            <p className="text-sm text-gray-600">Si todavía no conocés ruta y folio, dejá ambos vacíos. La conexión quedará pendiente de completar.</p>
            <label className="block">Barrio (opcional)<select className="input-field mt-1" value={form.idBarrio} onChange={e => changeForm('idBarrio', e.target.value)}><option value="">Seleccionar</option>{catalogs.barrios.filter(b => (b.Activo && catalogs.zonas.some(z => z.Id === b.idZona && z.Activo)) || b.Id === Number(form.idBarrio)).map(b => <option key={b.Id} value={b.Id} disabled={!b.Activo || !catalogs.zonas.some(z => z.Id === b.idZona && z.Activo)}>{b.Nombre} — {zoneName(b.idZona)}</option>)}</select></label>
          </> : <>
            <label className="block">Nombre<input autoFocus required maxLength={100} className="input-field mt-1" value={form.Nombre} onChange={e => changeForm('Nombre', e.target.value)} /></label>
            {form.kind === 'barrios' && <label className="block">Zona<select required className="input-field mt-1" value={form.idZona} onChange={e => changeForm('idZona', e.target.value)}><option value="">Seleccionar</option>{selectZones.map(z => <option key={z.Id} value={z.Id}>{z.Nombre}{!z.Activo && ' (inactiva)'}</option>)}</select></label>}
            <label className="block"><input type="checkbox" checked={form.Activo} onChange={e => changeForm('Activo', e.target.checked)} /> Activo</label>
            {!form.Activo && <p className="text-sm text-gray-600">Se conserva el historial. Para desactivar, primero deben resolverse las asociaciones activas.</p>}
          </>}
          <label className="block">Motivo del cambio<textarea required maxLength={300} className="input-field mt-1" value={form.Motivo} onChange={e => changeForm('Motivo', e.target.value)} /></label>
        </fieldset>
        {formError && <p role="alert" className="text-red-700">{formError}</p>}
        <div className="flex gap-3 justify-end"><button type="button" className="btn-secondary" disabled={saving} onClick={() => setForm(null)}>Cancelar</button><button className="btn-primary disabled:opacity-50" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </dialog>}
  </div>
}

function HistoryValues({ title, value }) {
  let data
  try { data = JSON.parse(value) } catch { data = null }
  const labels = { Id: 'Identificador', Nombre: 'Nombre', Activo: 'Activo', idZona: 'Zona (ID)', idBarrio: 'Barrio (ID)', Direccion: 'Dirección', idServicioSocio: 'Conexión (ID)' }
  return <div className="mt-2"><strong>{title}</strong>{data ? <dl>{Object.entries(data).filter(([key]) => key !== 'Version').map(([key, val]) => <div key={key}><dt className="inline">{labels[key] || key}: </dt><dd className="inline">{typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val ?? 'Sin asignar')}</dd></div>)}</dl> : <p>Sin registro anterior</p>}</div>
}
