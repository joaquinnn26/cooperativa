import React, { useMemo, useState } from 'react'
import { Search, FileDown, FileSpreadsheet, Table } from 'lucide-react'
import { useSocios } from '@/hooks/useSocios.js'
import TablaSocios from '@/features/admin/components/socios/TablaSocios.jsx'
import ModalCrearSocio from '@/features/admin/components/socios/ModalCrearSocio.jsx'
import ModalEditarSocio from '@/features/admin/components/socios/ModalEditarSocio.jsx'
import ModalEliminarSocio from '@/features/admin/components/socios/ModalEliminarSocio.jsx'
import { showToast } from '@/utils/alerts.js'

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

  const filtered = useMemo(
    () =>
      socios.filter((s) =>
        `${s.Persona?.Nombre} ${s.Persona?.Apellido} ${s.Persona?.Documento}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [socios, search]
  )

  const exportar = (tipo) =>
    showToast({
      title: 'Exportacion pendiente',
      message: `Exportar ${tipo} aun no esta implementado.`,
      type: 'info'
    })

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2 border rounded px-3 py-2 bg-white w-72">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar socio..."
            className="w-full outline-none text-sm"
          />
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowCrear(true)} className="bg-green-600 text-white px-4 py-2 rounded">
            + Agregar
          </button>
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => exportar('PDF')}>
            <FileDown className="w-4 h-4 inline mr-1" />
            PDF
          </button>
          <button
            className="bg-green-700 text-white px-4 py-2 rounded"
            onClick={() => exportar('Excel')}
          >
            <FileSpreadsheet className="w-4 h-4 inline mr-1" />
            Excel
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => exportar('CSV')}>
            <Table className="w-4 h-4 inline mr-1" />
            CSV
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-600">Cargando socios...</p>
        ) : (
          <>
            <TablaSocios
              socios={filtered}
              onEditar={abrirEditar}
              onEliminar={abrirEliminar}
              onToggleEstado={(socio) => toggleEstadoSocio(socio.idSocio)}
            />
          </>
        )}
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
