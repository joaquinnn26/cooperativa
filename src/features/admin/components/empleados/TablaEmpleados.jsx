import React, { useMemo } from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import DataTable from '@/components/DataTable.jsx'

export default function TablaEmpleados({ empleados, onEditar, onEliminar, onToggleEstado }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'idEmpleado',
        header: 'ID',
        cell: ({ getValue }) => <span className="font-semibold text-gray-900">#{getValue()}</span>
      },
      {
        id: 'nombre',
        header: 'Nombre',
        accessorFn: (empleado) =>
          `${empleado.Persona?.Nombre || ''} ${empleado.Persona?.Apellido || ''}`.trim(),
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() || 'Sin nombre'}</span>
      },
      {
        id: 'documento',
        header: 'Documento',
        accessorFn: (empleado) => empleado.Persona?.Documento || ''
      },
      {
        id: 'cargo',
        header: 'Cargo',
        accessorFn: (empleado) => empleado.Cargo?.Nombre || 'Sin cargo'
      },
      {
        id: 'telefono',
        header: 'Telefono',
        accessorFn: (empleado) => empleado.Persona?.Telefono || 'No informado'
      },
      {
        id: 'email',
        header: 'Email',
        accessorFn: (empleado) => empleado.Persona?.Email || 'No informado'
      },
      {
        id: 'estado',
        header: 'Estado',
        enableSorting: false,
        cell: ({ row }) => {
          const empleado = row.original
          return (
            <button
              type="button"
              onClick={() => onToggleEstado(empleado)}
              className={`inline-flex min-w-[92px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                empleado.Activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {empleado.Activo ? 'Activo' : 'Inactivo'}
            </button>
          )
        }
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const empleado = row.original
          return (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onEditar(empleado)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50"
                aria-label="Editar empleado"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(empleado)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
                aria-label="Eliminar empleado"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        }
      }
    ],
    [onEditar, onEliminar, onToggleEstado]
  )

  return <DataTable columns={columns} data={empleados} emptyMessage="No hay empleados para mostrar." />
}
