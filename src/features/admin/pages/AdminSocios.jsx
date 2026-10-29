import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Loader2, Plus, Search, Table, UserCheck, UserRoundX, UsersRound, X } from 'lucide-react'
import { useSocios } from '@/hooks/useSocios.js'
import TablaSocios from '@/features/admin/components/socios/TablaSocios.jsx'
import ModalCrearSocio from '@/features/admin/components/socios/ModalCrearSocio.jsx'
import ModalEditarSocio from '@/features/admin/components/socios/ModalEditarSocio.jsx'
import ModalEliminarSocio from '@/features/admin/components/socios/ModalEliminarSocio.jsx'
import { showToast } from '@/utils/alerts.js'
import { exportTable } from '@/utils/exportTable.js'
import './PersonasAdmin.css'

const columns = [
  { header: 'ID', value: (item) => item.idSocio }, { header: 'Nombre', value: (item) => item.Persona?.Nombre },
  { header: 'Apellido', value: (item) => item.Persona?.Apellido }, { header: 'Documento', value: (item) => item.Persona?.Documento },
  { header: 'Teléfono', value: (item) => item.Persona?.Telefono }, { header: 'Email', value: (item) => item.Persona?.Email },
  { header: 'Estado', value: (item) => item.Activo ? 'Activo' : 'Inactivo' }
]

function Pagination({ current, total, count, shown, size, onSize, onPage }) {
  const from = shown ? (current - 1) * size + 1 : 0, to = Math.min(current * size, count)
  return <div className="people-pagination"><span>Mostrando <strong>{from}–{to}</strong> de {count}</span><div className="people-pagination__controls"><select value={size} onChange={(event) => onSize(Number(event.target.value))} aria-label="Socios por página"><option value={10}>10 por página</option><option value={25}>25 por página</option><option value={50}>50 por página</option></select><button type="button" disabled={current === 1} onClick={() => onPage(current - 1)} aria-label="Página anterior"><ChevronLeft size={15} /></button><strong>{current}/{total}</strong><button type="button" disabled={current === total} onClick={() => onPage(current + 1)} aria-label="Página siguiente"><ChevronRight size={15} /></button></div></div>
}

export default function AdminSocios() {
  const { socios, loading, fetchSocios, eliminarSocio, toggleEstadoSocio } = useSocios(true)
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('todos'), [page, setPage] = useState(1), [size, setSize] = useState(10)
  const [create, setCreate] = useState(false), [edit, setEdit] = useState(false), [remove, setRemove] = useState(false), [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(null), [exportOpen, setExportOpen] = useState(false)
  const summary = useMemo(() => ({ total: socios.length, activos: socios.filter((item) => item.Activo).length, inactivos: socios.filter((item) => !item.Activo).length }), [socios])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return socios.filter((item) => filter === 'activos' ? item.Activo : filter === 'inactivos' ? !item.Activo : true).filter((item) => [item.Persona?.Nombre, item.Persona?.Apellido, item.Persona?.Documento, item.Persona?.Telefono, item.Persona?.Email].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [socios, search, filter])
  const pages = Math.max(1, Math.ceil(filtered.length / size)), current = Math.min(page, pages), paginated = filtered.slice((current - 1) * size, current * size)
  const chooseFilter = (value) => { setFilter(value); setPage(1) }
  const exportList = async (type) => {
    setExportOpen(false)
    if (!filtered.length) { showToast({ title: 'Sin datos', message: 'No hay socios para exportar con los filtros actuales.', type: 'info' }); return }
    try { setExporting(type); await exportTable({ type, filename: 'socios', title: 'Listado de socios', columns, rows: filtered }) }
    catch (error) { showToast({ title: 'Error al exportar', message: error.message || 'No se pudo generar el archivo.', type: 'error' }) }
    finally { setExporting(null) }
  }
  const confirmRemove = async () => { if (!selected) return; await eliminarSocio(selected.idSocio); setRemove(false); setSelected(null) }

  return <main className="people-page">
    <section className="people-hero"><div className="people-hero__copy"><span className="people-eyebrow"><UsersRound size={14} /> COMUNIDAD DE LA COOPERATIVA</span><h1>Socios</h1><p>Consultá los datos de contacto, administrá el estado de cada cuenta y encontrá rápidamente a cualquier socio.</p></div><div className="people-hero__actions"><button type="button" className="people-add" onClick={() => setCreate(true)}><Plus size={18} />Agregar socio</button><div className="people-export-wrap"><button type="button" className="people-export-trigger" onClick={() => setExportOpen((value) => !value)}><FileDown size={17} />Exportar<ChevronDown size={14} /></button>{exportOpen && <div className="people-export-menu"><button disabled={Boolean(exporting)} onClick={() => exportList('PDF')}><FileDown size={15} />Documento PDF</button><button disabled={Boolean(exporting)} onClick={() => exportList('Excel')}><FileSpreadsheet size={15} />Planilla Excel</button><button disabled={Boolean(exporting)} onClick={() => exportList('PSV')}><Table size={15} />Archivo PSV</button></div>}</div></div></section>
    <section className="people-stats" aria-label="Resumen de socios"><button className={`people-stat ${filter === 'todos' ? 'is-selected' : ''}`} onClick={() => chooseFilter('todos')}><span><UsersRound size={20} /></span><div><strong>{summary.total}</strong><p>SOCIOS REGISTRADOS</p></div></button><button className={`people-stat is-active ${filter === 'activos' ? 'is-selected' : ''}`} onClick={() => chooseFilter('activos')}><span><UserCheck size={20} /></span><div><strong>{summary.activos}</strong><p>CUENTAS ACTIVAS</p></div></button><button className={`people-stat is-inactive ${filter === 'inactivos' ? 'is-selected' : ''}`} onClick={() => chooseFilter('inactivos')}><span><UserRoundX size={20} /></span><div><strong>{summary.inactivos}</strong><p>CUENTAS INACTIVAS</p></div></button></section>
    <section className="people-panel"><div className="people-toolbar is-simple"><label className="people-search"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar por nombre, documento, teléfono o email…" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda"><X size={14} /></button>}</label><span className="people-results"><i />{loading ? 'Cargando socios…' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}</span></div>
      {!loading && <Pagination current={current} total={pages} count={filtered.length} shown={paginated.length} size={size} onSize={(value) => { setSize(value); setPage(1) }} onPage={setPage} />}
      {loading ? <div className="people-loading"><Loader2 size={27} /><span>Cargando socios…</span></div> : paginated.length ? <div className="people-table-wrap people-table"><TablaSocios socios={paginated} onEditar={(item) => { setSelected(item); setEdit(true) }} onEliminar={(item) => { setSelected(item); setRemove(true) }} onToggleEstado={(item) => toggleEstadoSocio(item.idSocio)} /></div> : <div className="people-empty"><Search size={28} /><h3>No encontramos socios</h3><p>Probá con otro término o cambiá el filtro seleccionado.</p></div>}
      {!loading && paginated.length > 0 && <Pagination current={current} total={pages} count={filtered.length} shown={paginated.length} size={size} onSize={(value) => { setSize(value); setPage(1) }} onPage={setPage} />}
    </section>
    <ModalCrearSocio show={create} onClose={() => setCreate(false)} onSaved={fetchSocios} />
    <ModalEditarSocio show={edit} socio={selected} onClose={() => setEdit(false)} onRefresh={fetchSocios} />
    <ModalEliminarSocio show={remove} socio={selected} onClose={() => setRemove(false)} onConfirm={confirmRemove} />
  </main>
}
