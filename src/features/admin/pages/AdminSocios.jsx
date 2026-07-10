import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Plus, Search, Table } from 'lucide-react'
import { useSocios } from '@/hooks/useSocios.js'
import TablaSocios from '@/features/admin/components/socios/TablaSocios.jsx'
import ModalCrearSocio from '@/features/admin/components/socios/ModalCrearSocio.jsx'
import ModalEditarSocio from '@/features/admin/components/socios/ModalEditarSocio.jsx'
import ModalEliminarSocio from '@/features/admin/components/socios/ModalEliminarSocio.jsx'
import { showToast } from '@/utils/alerts.js'
import { exportTable } from '@/utils/exportTable.js'

const SOCIOS_EXPORT_COLUMNS = [
  { header: 'ID', value: (socio) => socio.idSocio },
  { header: 'Nombre', value: (socio) => socio.Persona?.Nombre },
  { header: 'Apellido', value: (socio) => socio.Persona?.Apellido },
  { header: 'Documento', value: (socio) => socio.Persona?.Documento },
  { header: 'Telefono', value: (socio) => socio.Persona?.Telefono },
  { header: 'Email', value: (socio) => socio.Persona?.Email },
  { header: 'Estado', value: (socio) => (socio.Activo ? 'Activo' : 'Inactivo') }
]

export default function AdminSocios() {
  const {
    socios,
    loading,
    fetchSocios,
    eliminarSocio,
    toggleEstadoSocio
  } = useSocios(true)

  const [search, setSearch] = useState('')
  const [showCrear, setShowCrear] = useState(false)
  const [showEditar, setShowEditar] = useState(false)
  const [showEliminar, setShowEliminar] = useState(false)
  const [socioSeleccionado, setSocioSeleccionado] = useState(null)
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exporting, setExporting] = useState(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return socios
      .filter((socio) => {
        if (estadoFiltro === 'activos') return socio.Activo
        if (estadoFiltro === 'inactivos') return !socio.Activo
        return true
      })
      .filter((socio) =>
        [
          socio.Persona?.Nombre,
          socio.Persona?.Apellido,
          socio.Persona?.Documento,
          socio.Persona?.Telefono,
          socio.Persona?.Email
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
  }, [estadoFiltro, socios, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [currentPage, filtered, pageSize])

  const summary = useMemo(
    () => ({
      total: socios.length,
      activos: socios.filter((socio) => socio.Activo).length,
      inactivos: socios.filter((socio) => !socio.Activo).length
    }),
    [socios]
  )

  const exportar = async (tipo) => {
    if (!filtered.length) {
      showToast({
        title: 'Sin datos',
        message: 'No hay socios para exportar con los filtros actuales.',
        type: 'info'
      })
      return
    }

    try {
      setExporting(tipo)
      await exportTable({
        type: tipo,
        filename: 'socios',
        title: 'Listado de socios',
        columns: SOCIOS_EXPORT_COLUMNS,
        rows: filtered
      })
    } catch (error) {
      showToast({
        title: 'Error al exportar',
        message: error.message || 'No se pudo generar el archivo.',
        type: 'error'
      })
    } finally {
      setExporting(null)
    }
  }

  const abrirEditar = (socio) => {
    setSocioSeleccionado(socio)
    setShowEditar(true)
  }

  const abrirEliminar = (socio) => {
    setSocioSeleccionado(socio)
    setShowEliminar(true)
  }

  const confirmarEliminar = async () => {
    if (!socioSeleccionado) return
    await eliminarSocio(socioSeleccionado.idSocio)
    setShowEliminar(false)
  }

  const resetToFirstPage = (callback) => {
    setPage(1)
    callback()
  }

  const pagination = (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {paginated.length ? (currentPage - 1) * pageSize + 1 : 0}-
        {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(1)
          }}
          className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
          aria-label="Cantidad de socios por pagina"
        >
          <option value={10}>10 por pagina</option>
          <option value={25}>25 por pagina</option>
          <option value={50}>50 por pagina</option>
        </select>
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm font-medium text-gray-700">
          {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Socios</h1>
          <p className="mt-1 text-gray-600">Busca, filtra y gestiona socios sin recorrer una lista larga.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCrear(true)}
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => exportar('PDF')}
            disabled={Boolean(exporting)}
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            {exporting === 'PDF' ? 'Generando...' : 'PDF'}
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => exportar('Excel')}
            disabled={Boolean(exporting)}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            {exporting === 'Excel' ? 'Generando...' : 'Excel'}
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => exportar('PSV')}
            disabled={Boolean(exporting)}
          >
            <Table className="mr-1.5 h-4 w-4" />
            {exporting === 'PSV' ? 'Generando...' : 'PSV'}
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setEstadoFiltro('todos'))}
          className={`rounded-lg border p-4 text-left ${estadoFiltro === 'todos' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setEstadoFiltro('activos'))}
          className={`rounded-lg border p-4 text-left ${estadoFiltro === 'activos' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.activos}</p>
        </button>
        <button
          type="button"
          onClick={() => resetToFirstPage(() => setEstadoFiltro('inactivos'))}
          className={`rounded-lg border p-4 text-left ${estadoFiltro === 'inactivos' ? 'border-slate-500 bg-slate-50' : 'border-gray-200 bg-white'}`}
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Inactivos</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{summary.inactivos}</p>
        </button>
      </section>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 lg:max-w-xl">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nombre, documento, telefono o email..."
              className="w-full min-w-0 text-sm outline-none"
            />
          </div>
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando socios...' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {!loading ? pagination : null}
        {loading ? (
          <p className="px-4 py-10 text-center text-gray-600">Cargando socios...</p>
        ) : (
          <div className="overflow-x-auto">
            <TablaSocios
              socios={paginated}
              onEditar={abrirEditar}
              onEliminar={abrirEliminar}
              onToggleEstado={(socio) => toggleEstadoSocio(socio.idSocio)}
            />
          </div>
        )}
        {!loading ? pagination : null}
      </div>

      <ModalCrearSocio
        show={showCrear}
        onClose={() => setShowCrear(false)}
        onSaved={fetchSocios}
      />

      <ModalEditarSocio
        show={showEditar}
        socio={socioSeleccionado}
        onClose={() => setShowEditar(false)}
        onRefresh={fetchSocios}
      />

      <ModalEliminarSocio
        show={showEliminar}
        socio={socioSeleccionado}
        onClose={() => setShowEliminar(false)}
        onConfirm={confirmarEliminar}
      />
    </div>
  )
}
