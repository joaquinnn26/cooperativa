import React, { useMemo } from 'react'
import { Briefcase, Edit3, Mail, Phone, Trash2 } from 'lucide-react'
import DataTable from '@/components/DataTable.jsx'

const initials = (person) => `${person?.Nombre?.[0] || ''}${person?.Apellido?.[0] || ''}`.toUpperCase() || 'E'
export default function TablaEmpleados({ empleados, onEditar, onEliminar, onToggleEstado }) {
  const columns = useMemo(() => [
    { accessorKey: 'idEmpleado', header: 'ID', cell: ({ getValue }) => <span className="text-xs font-semibold text-gray-500">#{getValue()}</span> },
    { id: 'nombre', header: 'Empleado', accessorFn: (item) => `${item.Persona?.Nombre || ''} ${item.Persona?.Apellido || ''}`.trim(), cell: ({ row, getValue }) => <div className="people-identity"><span className="people-avatar">{initials(row.original.Persona)}</span><div className="min-w-0"><strong className="truncate">{getValue() || 'Sin nombre'}</strong><small>Doc. {row.original.Persona?.Documento || 'No informado'}</small></div></div> },
    { id: 'cargo', header: 'Cargo', accessorFn: (item) => item.Cargo?.Nombre || 'Pendiente de asignación', cell: ({ getValue }) => <span className="people-role"><Briefcase size={13} />{getValue()}</span> },
    { id: 'contacto', header: 'Contacto', accessorFn: (item) => `${item.Persona?.Telefono || ''} ${item.Persona?.Email || ''}`, cell: ({ row }) => <div className="people-contact"><span><Phone size={13} />{row.original.Persona?.Telefono || 'Sin teléfono'}</span><span><Mail size={13} /><span className="max-w-[220px] truncate">{row.original.Persona?.Email || 'Sin email'}</span></span></div> },
    { id: 'estado', header: 'Estado', enableSorting: false, cell: ({ row }) => <button type="button" onClick={() => onToggleEstado(row.original)} className={`people-status ${row.original.Activo ? 'is-active' : ''}`}>{row.original.Activo ? 'Activo' : 'Inactivo'}</button> },
    { id: 'acciones', header: 'Acciones', enableSorting: false, cell: ({ row }) => <div className="people-row-actions"><button type="button" onClick={() => onEditar(row.original)} className="people-row-action" aria-label="Asignar o cambiar área y puesto" title="Asignar área y puesto"><Edit3 size={15} /></button><button type="button" onClick={() => onEliminar(row.original)} className="people-row-action is-danger" aria-label="Dar de baja empleado" title="Dar de baja"><Trash2 size={15} /></button></div> }
  ], [onEditar, onEliminar, onToggleEstado])
  return <DataTable columns={columns} data={empleados} emptyMessage="No hay empleados para mostrar." />
}
