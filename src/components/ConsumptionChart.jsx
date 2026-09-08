import React, { useMemo } from 'react'

function monthLabel(dateValue) {
  const date = new Date(dateValue)
  return date.toLocaleDateString('es-AR', { month: 'short' })
}

export default function ConsumptionChart({ measurements }) {
  const chartData = useMemo(() => {
    const grouped = measurements.reduce((acc, item) => {
      const key = new Date(item.FechaLectura).toISOString().slice(0, 7)
      acc[key] = (acc[key] || 0) + Number(item.Consumo || 0)
      return acc
    }, {})

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({
        key,
        label: monthLabel(`${key}-01T00:00:00.000Z`),
        value
      }))
  }, [measurements])

  const maxValue = Math.max(...chartData.map((item) => item.value), 1)

  if (!chartData.length) {
    return <p className="text-sm text-gray-500">Todavia no hay mediciones para graficar.</p>
  }

  return (
    <div className="space-y-3">
      {chartData.map((item) => (
        <div key={item.key} className="grid grid-cols-[40px_1fr_70px] items-center gap-3">
          <span className="text-sm font-medium uppercase text-gray-500">{item.label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
            />
          </div>
          <span className="text-right text-sm font-semibold text-gray-700">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
