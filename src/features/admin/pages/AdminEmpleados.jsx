import React, { useMemo, useState } from 'react'
import { Briefcase, FileDown, FileSpreadsheet, Search, Table } from 'lucide-react'
import { useEmpleados } from '@/hooks/useEmpleados.js'
import TablaEmpleados from '@/features/admin/components/empleados/TablaEmpleados.jsx'
import ModalCrearEmpleado from '@/features/admin/components/empleados/ModalCrearEmpleado.jsx'
import ModalEditarEmpleado from '@/features/admin/components/empleados/ModalEditarEmpleado.jsx'
import ModalEliminarEmpleado from '@/features/admin/components/empleados/ModalEliminarEmpleado.jsx'
import { showToast } from '@/utils/alerts.js'

export default function AdminEmpleados() {
  const {
    empleados,
    loading,
    fetchEmpleados,
    eliminarEmpleado,
    toggleEstadoEmpleado
  } = useEmpleados(true)

  const [search, setSearch] = useState('')
  const [showCrear, setShowCrear] = useState(false)
  const [showEditar, setShowEditar] = useState(false)
  const [showEliminar, setShowEliminar] = useState(false)
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null)

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase()

    return empleados.filter((empleado) =>
      [
        empleado.Persona?.Nombre,
        empleado.Persona?.Apellido,
        empleado.Persona?.Documento,
        empleado.Persona?.Email,
        empleado.Cargo?.Nombre
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [empleados, search])

  const exportar = (tipo) =>
    showToast({
      title: 'Exportacion pendiente',
      message: `Exportar ${tipo} aun no esta implementado.`,
      type: 'info'
    })

  const abrirEditar = (empleado) => {
    setEmpleadoSeleccionado(empleado)
    setShowEditar(true)
  }

  const abrirEliminar = (empleado) => {
    setEmpleadoSeleccionado(empleado)
    setShowEliminar(true)
  }

  const confirmarEliminar = async () => {
    if (!empleadoSeleccionado) return
    try {
      await eliminarEmpleado(empleadoSeleccionado.idEmpleado)
      setShowEliminar(false)
      setEmpleadoSeleccionado(null)
    } catch (error) {
      showToast({
        title: 'Error',
        message: error.message || 'No se pudo eliminar el empleado.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-600">Promueve socios registrados, asigna cargos y administra bajas.</p>
        </div>
        <div className="rounded-full bg-amber-100 p-3 text-amber-700">
          <Briefcase className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <div className="flex w-72 items-center gap-2 rounded border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empleado..."
            className="w-full text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCrear(true)} className="rounded bg-green-600 px-4 py-2 text-white">
            + Nuevo empleado
          </button>
          <button className="rounded bg-red-600 px-4 py-2 text-white" onClick={() => exportar('PDF')}>
            <FileDown className="mr-1 inline h-4 w-4" />
            PDF
          </button>
          <button className="rounded bg-green-700 px-4 py-2 text-white" onClick={() => exportar('Excel')}>
            <FileSpreadsheet className="mr-1 inline h-4 w-4" />
            Excel
          </button>
          <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => exportar('CSV')}>
            <Table className="mr-1 inline h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-600">Cargando empleados...</p>
        ) : (
          <>
            <TablaEmpleados
              empleados={filtered}
              onEditar={abrirEditar}
              onEliminar={abrirEliminar}
              onToggleEstado={(empleado) => toggleEstadoEmpleado(empleado.idEmpleado)}
            />
          </>
        )}
      </div>

      <ModalCrearEmpleado
        show={showCrear}
        onClose={() => setShowCrear(false)}
        onSaved={fetchEmpleados}
        empleadosExistentes={empleados}
      />

      <ModalEditarEmpleado
        show={showEditar}
        empleado={empleadoSeleccionado}
        onClose={() => setShowEditar(false)}
        onRefresh={fetchEmpleados}
      />

      <ModalEliminarEmpleado
        show={showEliminar}
        empleado={empleadoSeleccionado}
        onClose={() => setShowEliminar(false)}
        onConfirm={confirmarEliminar}
      />
    </div>
  )
}
