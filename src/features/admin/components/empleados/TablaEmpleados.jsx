import React, { useMemo } from 'react'
import { Briefcase, Edit3, Mail, Phone, Trash2 } from 'lucide-react'
import DataTable from '@/components/DataTable.jsx'

export default function TablaEmpleados({ empleados, onEditar, onEliminar, onToggleEstado }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'idEmpleado',
        header: 'ID',
        cell: ({ getValue }) => <span className="text-xs font-semibold text-gray-500">#{getValue()}</span>
      },
      {
        id: 'nombre',
        header: 'Empleado',
        accessorFn: (empleado) =>
          `${empleado.Persona?.Nombre || ''} ${empleado.Persona?.Apellido || ''}`.trim(),
        cell: ({ row, getValue }) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{getValue() || 'Sin nombre'}</p>
            <p className="text-xs text-gray-500">Doc. {row.original.Persona?.Documento || 'No informado'}</p>
          </div>
        )
      },
      {
        id: 'cargo',
        header: 'Cargo',
        accessorFn: (empleado) => empleado.Cargo?.Nombre || 'Sin cargo',
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Briefcase className="h-3.5 w-3.5" />
            {getValue()}
          </span>
        )
      },
      {
        id: 'contacto',
        header: 'Contacto',
        accessorFn: (empleado) => `${empleado.Persona?.Telefono || ''} ${empleado.Persona?.Email || ''}`.trim(),
        cell: ({ row }) => (
          <div className="space-y-1 text-xs text-gray-600">
            <p className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {row.original.Persona?.Telefono || 'Sin telefono'}
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span className="max-w-[220px] truncate">{row.original.Persona?.Email || 'Sin email'}</span>
            </p>
          </div>
        )
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
              className={`inline-flex min-w-[82px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
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
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onEditar(empleado)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50"
                aria-label="Editar empleado"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(empleado)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
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
