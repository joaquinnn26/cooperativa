import React, { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart2, Download, PieChart } from 'lucide-react'
import { apiUrl } from '@/config/api.js'
import useCooperativeStore from '@/store/cooperativeStore.js'

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadCsv(rows) {
  const header = ['Tipo', 'Identificador', 'Socio', 'Estado', 'Monto', 'Fecha']
  const content = [header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte-cooperativa-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminReportes() {
  const fetchBills = useCooperativeStore((state) => state.fetchBills)
  const [bills, setBills] = useState([])
  const [claims, setClaims] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        const [billData, claimResponse] = await Promise.all([
          fetchBills(),
          fetch(apiUrl('/reclamo'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
        ])
        if (!claimResponse.ok) throw new Error('No se pudieron obtener los reclamos.')
        const claimData = await claimResponse.json()
        setBills(billData || [])
        setClaims(Array.isArray(claimData) ? claimData : [])
      } catch (loadError) {
        setError(loadError.message || 'No se pudo generar el reporte.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [fetchBills])

  const metrics = useMemo(() => {
    const paid = bills.filter((bill) => bill.status === 'paid')
    const pending = bills.filter((bill) => bill.status !== 'paid')
    const activeClaims = claims.filter((claim) => {
      const status = String(claim.Estado || claim.estado || '').toLowerCase()
      return !['resuelto', 'cancelado'].includes(status)
    })

    return {
      collected: paid.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      pendingAmount: pending.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      pendingCount: pending.length,
      activeClaims: activeClaims.length
    }
  }, [bills, claims])

  const exportReport = () => {
    const billRows = bills.map((bill) => [
      'Factura',
      bill.id,
      bill.socioNombre,
      bill.status,
      bill.amount,
      bill.createdAt
    ])
    const claimRows = claims.map((claim) => [
      'Reclamo',
      claim.idReclamo,
      [claim.Socio?.Nombre, claim.Socio?.Apellido].filter(Boolean).join(' '),
      claim.Estado,
      '',
      claim.Fecha
    ])
    downloadCsv([...billRows, ...claimRows])
  }

  const cards = [
    {
      label: 'Facturas cobradas',
      value: metrics.collected.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
      detail: `${bills.filter((bill) => bill.status === 'paid').length} facturas`,
      icon: BarChart2,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      label: 'Pendiente de cobro',
      value: metrics.pendingAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
      detail: `${metrics.pendingCount} facturas`,
      icon: PieChart,
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      label: 'Reclamos activos',
      value: String(metrics.activeClaims),
      detail: `${claims.length} reclamos totales`,
      icon: Activity,
      color: 'bg-red-100 text-red-700'
    }
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Indicadores calculados con datos actuales de facturas y reclamos.</p>
        </div>
        <button
          onClick={exportReport}
          disabled={loading || Boolean(error)}
          className="btn-secondary inline-flex items-center disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
      {loading && <div className="card text-gray-600">Generando reporte...</div>}

      {!loading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{card.detail}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            ))}
          </div>

          <div className="card overflow-x-auto">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Facturas recientes</h2>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {bills.slice(0, 10).map((bill) => (
                  <tr key={bill.id} className="border-b">
                    <td className="px-4 py-3">#{bill.id}</td>
                    <td className="px-4 py-3">{bill.socioNombre}</td>
                    <td className="px-4 py-3">{bill.status}</td>
                    <td className="px-4 py-3 text-right">
                      {Number(bill.amount || 0).toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
