import React, { useMemo, useState } from 'react'
import { BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Loader2, Plus, Search, Table, UserCheck, UserRoundX, UsersRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import TablaEmpleados from '@/features/admin/components/empleados/TablaEmpleados.jsx'
import ModalCrearEmpleado from '@/features/admin/components/empleados/ModalCrearEmpleado.jsx'
import ModalEliminarEmpleado from '@/features/admin/components/empleados/ModalEliminarEmpleado.jsx'
import { showToast } from '@/utils/alerts.js'
import { exportTable } from '@/utils/exportTable.js'
import './PersonasAdmin.css'

const columns = [
  { header: 'ID', value: (item) => item.idEmpleado }, { header: 'Nombre', value: (item) => item.Persona?.Nombre },
  { header: 'Apellido', value: (item) => item.Persona?.Apellido }, { header: 'Documento', value: (item) => item.Persona?.Documento },
  { header: 'Cargo', value: (item) => item.Cargo?.Nombre }, { header: 'Teléfono', value: (item) => item.Persona?.Telefono },
  { header: 'Email', value: (item) => item.Persona?.Email }, { header: 'Fecha de inicio', value: (item) => String(item.FechaDelInicio || '').slice(0, 10) },
  { header: 'Estado', value: (item) => item.Activo ? 'Activo' : 'Inactivo' }
]
function Pagination({ current, total, count, shown, size, onSize, onPage }) {
  const from = shown ? (current - 1) * size + 1 : 0, to = Math.min(current * size, count)
  return <div className="people-pagination"><span>Mostrando <strong>{from}–{to}</strong> de {count}</span><div className="people-pagination__controls"><select value={size} onChange={(event) => onSize(Number(event.target.value))} aria-label="Empleados por página"><option value={10}>10 por página</option><option value={25}>25 por página</option><option value={50}>50 por página</option></select><button disabled={current === 1} onClick={() => onPage(current - 1)} aria-label="Página anterior"><ChevronLeft size={15} /></button><strong>{current}/{total}</strong><button disabled={current === total} onClick={() => onPage(current + 1)} aria-label="Página siguiente"><ChevronRight size={15} /></button></div></div>
}

export default function AdminEmpleados() {
  const navigate = useNavigate()
  const { empleados, loading, fetchEmpleados, eliminarEmpleado, toggleEstadoEmpleado } = useEmpleados(true)
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('todos'), [role, setRole] = useState('todos'), [page, setPage] = useState(1), [size, setSize] = useState(10)
  const [create, setCreate] = useState(false), [remove, setRemove] = useState(false), [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(null), [exportOpen, setExportOpen] = useState(false)
  const roles = useMemo(() => Array.from(new Set(empleados.map((item) => item.Cargo?.Nombre).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')), [empleados])
  const summary = useMemo(() => ({ total: empleados.length, activos: empleados.filter((item) => item.Activo).length, inactivos: empleados.filter((item) => !item.Activo).length }), [empleados])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return empleados.filter((item) => filter === 'activos' ? item.Activo : filter === 'inactivos' ? !item.Activo : true).filter((item) => role === 'todos' || item.Cargo?.Nombre === role).filter((item) => [item.Persona?.Nombre, item.Persona?.Apellido, item.Persona?.Documento, item.Persona?.Telefono, item.Persona?.Email, item.Cargo?.Nombre].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [empleados, search, filter, role])
  const pages = Math.max(1, Math.ceil(filtered.length / size)), current = Math.min(page, pages), paginated = filtered.slice((current - 1) * size, current * size)
  const chooseFilter = (value) => { setFilter(value); setPage(1) }
  const exportList = async (type) => {
    setExportOpen(false)
    if (!filtered.length) { showToast({ title: 'Sin datos', message: 'No hay empleados para exportar con los filtros actuales.', type: 'info' }); return }
    try { setExporting(type); await exportTable({ type, filename: 'empleados', title: 'Listado de empleados', columns, rows: filtered }) }
    catch (error) { showToast({ title: 'Error al exportar', message: error.message || 'No se pudo generar el archivo.', type: 'error' }) }
    finally { setExporting(null) }
  }
  const confirmRemove = async () => {
    if (!selected) return
    try { await eliminarEmpleado(selected.idEmpleado); setRemove(false); setSelected(null) }
    catch (error) { showToast({ title: 'No se pudo dar de baja', message: error.message || 'Intentá nuevamente.', type: 'error' }) }
  }

  return <main className="people-page">
    <section className="people-hero"><div className="people-hero__copy"><span className="people-eyebrow"><BriefcaseBusiness size={14} /> EQUIPO DE TRABAJO</span><h1>Empleados</h1><p>Gestioná las cuentas laborales y accedé a la asignación de áreas, puestos y responsabilidades de cada integrante.</p></div><div className="people-hero__actions"><button type="button" className="people-add" onClick={() => setCreate(true)}><Plus size={18} />Nuevo empleado</button><div className="people-export-wrap"><button type="button" className="people-export-trigger" onClick={() => setExportOpen((value) => !value)}><FileDown size={17} />Exportar<ChevronDown size={14} /></button>{exportOpen && <div className="people-export-menu"><button disabled={Boolean(exporting)} onClick={() => exportList('PDF')}><FileDown size={15} />Documento PDF</button><button disabled={Boolean(exporting)} onClick={() => exportList('Excel')}><FileSpreadsheet size={15} />Planilla Excel</button><button disabled={Boolean(exporting)} onClick={() => exportList('PSV')}><Table size={15} />Archivo PSV</button></div>}</div></div></section>
    <section className="people-stats" aria-label="Resumen de empleados"><button className={`people-stat ${filter === 'todos' ? 'is-selected' : ''}`} onClick={() => chooseFilter('todos')}><span><UsersRound size={20} /></span><div><strong>{summary.total}</strong><p>EMPLEADOS REGISTRADOS</p></div></button><button className={`people-stat is-active ${filter === 'activos' ? 'is-selected' : ''}`} onClick={() => chooseFilter('activos')}><span><UserCheck size={20} /></span><div><strong>{summary.activos}</strong><p>CUENTAS ACTIVAS</p></div></button><button className={`people-stat is-inactive ${filter === 'inactivos' ? 'is-selected' : ''}`} onClick={() => chooseFilter('inactivos')}><span><UserRoundX size={20} /></span><div><strong>{summary.inactivos}</strong><p>CUENTAS INACTIVAS</p></div></button></section>
    <section className="people-panel"><div className="people-toolbar"><label className="people-search"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar por nombre, documento, cargo o email…" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda"><X size={14} /></button>}</label><select className="people-filter" value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }}><option value="todos">Todos los cargos</option>{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select><span className="people-results"><i />{loading ? 'Cargando empleados…' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}</span></div>
      {!loading && <Pagination current={current} total={pages} count={filtered.length} shown={paginated.length} size={size} onSize={(value) => { setSize(value); setPage(1) }} onPage={setPage} />}
      {loading ? <div className="people-loading"><Loader2 size={27} /><span>Cargando empleados…</span></div> : paginated.length ? <div className="people-table-wrap people-table"><TablaEmpleados empleados={paginated} onEditar={(item) => navigate(`/admin/organizacion?empleado=${item.idEmpleado}`)} onEliminar={(item) => { setSelected(item); setRemove(true) }} onToggleEstado={(item) => toggleEstadoEmpleado(item.idEmpleado)} /></div> : <div className="people-empty"><Search size={28} /><h3>No encontramos empleados</h3><p>Probá con otro término, cargo o estado.</p></div>}
      {!loading && paginated.length > 0 && <Pagination current={current} total={pages} count={filtered.length} shown={paginated.length} size={size} onSize={(value) => { setSize(value); setPage(1) }} onPage={setPage} />}
    </section>
    <ModalCrearEmpleado show={create} onClose={() => setCreate(false)} onSaved={fetchEmpleados} empleadosExistentes={empleados} />
    <ModalEliminarEmpleado show={remove} empleado={selected} onClose={() => setRemove(false)} onConfirm={confirmRemove} />
  </main>
}
