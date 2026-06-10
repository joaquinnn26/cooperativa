import React, { useMemo } from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import DataTable from '@/components/DataTable.jsx'

export default function TablaSocios({ socios, onEditar, onEliminar, onToggleEstado }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'idSocio',
        header: 'ID',
        cell: ({ getValue }) => <span className="font-semibold text-gray-900">#{getValue()}</span>
      },
      {
        id: 'nombre',
        header: 'Nombre',
        accessorFn: (socio) => `${socio.Persona?.Nombre || ''} ${socio.Persona?.Apellido || ''}`.trim(),
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() || 'Sin nombre'}</span>
      },
      {
        id: 'documento',
        header: 'Documento',
        accessorFn: (socio) => socio.Persona?.Documento || ''
      },
      {
        id: 'telefono',
        header: 'Telefono',
        accessorFn: (socio) => socio.Persona?.Telefono || 'No informado'
      },
      {
        id: 'email',
        header: 'Email',
        accessorFn: (socio) => socio.Persona?.Email || 'No informado'
      },
      {
        id: 'estado',
        header: 'Estado',
        enableSorting: false,
        cell: ({ row }) => {
          const socio = row.original
          return (
            <button
              type="button"
              onClick={() => onToggleEstado(socio)}
              className={`inline-flex min-w-[92px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                socio.Activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {socio.Activo ? 'Activo' : 'Inactivo'}
            </button>
          )
        }
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const socio = row.original
          return (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onEditar(socio)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50"
                aria-label="Editar socio"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(socio)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
                aria-label="Eliminar socio"
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

  return <DataTable columns={columns} data={socios} emptyMessage="No hay socios para mostrar." />
}
