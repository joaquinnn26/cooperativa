import React, { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export default function DataTable({ columns, data, emptyMessage = 'No hay datos para mostrar.' }) {
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()

                  return (
                    <th key={header.id} className="px-4 py-3 font-semibold">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={`inline-flex items-center gap-1 ${canSort ? 'hover:text-gray-900' : 'cursor-default'}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort ? (
                            sorted === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                            )
                          ) : null}
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {!table.getRowModel().rows.length ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">{emptyMessage}</div>
        ) : null}
      </div>
    </div>
  )
}
