import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Receipt } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { formatDate } from '@/utils/formatDate.js'

const PAGE_SIZE = 6

function statusStyles(status) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700'
    case 'overdue':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'paid':
      return 'Pagada'
    case 'overdue':
      return 'Vencida'
    default:
      return 'Por pagar'
  }
}

export default function SocioFacturas() {
  const usuario = useAuthStore((state) => state.usuario)
  const { socioId } = useCurrentSocio()
  const fetchBillsBySocio = useCooperativeStore((state) => state.fetchBillsBySocio)
  const [bills, setBills] = useState([])
  const [filter, setFilter] = useState('Todas')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchBillsBySocio({ idSocio: socioId, usuario }).then(setBills)
  }, [fetchBillsBySocio, socioId, usuario])

  const summary = useMemo(
    () => ({
      pending: bills.filter((bill) => bill.status === 'pending').length,
      overdue: bills.filter((bill) => bill.status === 'overdue').length,
      paid: bills.filter((bill) => bill.status === 'paid').length
    }),
    [bills]
  )

  const filteredBills = useMemo(() => {
    switch (filter) {
      case 'Por pagar':
        return bills.filter((bill) => bill.status === 'pending' || bill.status === 'overdue')
      case 'Pagadas':
        return bills.filter((bill) => bill.status === 'paid')
      default:
        return bills
    }
  }, [bills, filter])

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredBills.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredBills])

  useEffect(() => {
    setPage(1)
  }, [filter])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Facturas</h1>
        <p className="mt-2 text-gray-600">Consulta todo tu historial, separa las deudas vigentes y revisa las facturas ya pagadas.</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Por pagar</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Vencidas</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{summary.overdue}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pagadas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.paid}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Historial de facturas</p>
              <p className="text-sm text-gray-500">Mostrando {filteredBills.length} factura{filteredBills.length === 1 ? '' : 's'}.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Todas', 'Por pagar', 'Pagadas'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Emision</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Pago</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBills.map((bill) => (
                <tr key={bill.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{bill.service}</td>
                  <td className="px-4 py-3">{bill.period}</td>
                  <td className="px-4 py-3">{formatDate(bill.createdAt, 'es-AR')}</td>
                  <td className="px-4 py-3">{formatDate(bill.dueDate, 'es-AR')}</td>
                  <td className="px-4 py-3">${Number(bill.amount).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(bill.status)}`}>
                      {statusLabel(bill.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {bill.paymentLink && bill.status !== 'paid' ? (
                        <a
                          href={bill.paymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Ir a pagar
                        </a>
                      ) : bill.status === 'paid' ? (
                        <span className="text-xs font-semibold text-emerald-700">Pago registrado</span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin link</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredBills.length ? (
          <div className="py-10 text-center text-gray-500">No hay facturas para el filtro seleccionado.</div>
        ) : null}

        {filteredBills.length ? (
          <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Pagina {currentPage} de {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
