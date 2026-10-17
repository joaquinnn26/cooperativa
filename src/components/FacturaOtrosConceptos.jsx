import React from 'react'
export default function FacturaOtrosConceptos({ conceptos = [] }) {
  if (!conceptos.length) return null
  const money = value => Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
  return <details className="mt-2 min-w-56 text-xs"><summary className="cursor-pointer font-semibold text-teal-800">Otros servicios / conceptos</summary><dl className="mt-2 space-y-2">{conceptos.map((c, i) => <div className="flex justify-between gap-4" key={i}><dt>{c.Descripcion}</dt><dd>{money(c.Importe)}</dd></div>)}</dl><p className="mt-2 text-slate-500">Estos importes ya están incluidos en el total de la factura.</p></details>
}
