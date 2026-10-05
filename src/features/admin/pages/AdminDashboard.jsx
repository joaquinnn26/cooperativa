import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { laboralApi } from '@/utils/laboral.js'

const groups = [
  { title: 'Organización y personal', intro: 'Administrá accesos y estructura interna.', links: [
    ['/admin/organizacion', 'Organización laboral', 'Áreas, integrantes, funciones, encargados y motivos.'],
    ['/admin/empleados', 'Empleados', 'Altas, cargos y bajas laborales.'],
    ['/admin/legajos', 'Legajos de personas', 'Revisar los documentos vinculados a cada persona.']
  ] },
  { title: 'Atención a socios', intro: 'Accedé a los datos y requisitos usados en la atención.', links: [
    ['/admin/socios', 'Socios', 'Consultar personas y cuentas registradas.'],
    ['/admin/altas-socio', 'Altas de socios', 'Revisar requisitos y habilitar cuentas nuevas.'],
    ['/admin/requisitos-servicio', 'Requisitos de servicio', 'Consultar y configurar requisitos de solicitudes.']
  ] },
  { title: 'Servicios y operación', intro: 'Configuración de datos que respaldan la operación.', links: [
    ['/admin/servicios', 'Servicios', 'Consultar servicios disponibles.'],
    ['/admin/territorio', 'Conexiones y territorio', 'Ubicaciones, zonas, rutas y folios.'],
    ['/admin/medidores', 'Inventario de medidores', 'Equipos disponibles, instalados e historial.']
  ] },
  { title: 'Comunicación', intro: 'Información general para los socios.', links: [
    ['/admin/anuncios', 'Anuncios', 'Publicar y administrar avisos.']
  ] }
]

export default function AdminDashboard() {
  const [data, setData] = useState(null), [error, setError] = useState('')
  useEffect(() => { const abort = new AbortController(); laboralApi('/configuracion', { signal: abort.signal }).then(setData).catch(e => { if (!abort.signal.aborted) setError(e.message) }); return () => abort.abort() }, [])
  const setup = useMemo(() => {
    if (!data) return null
    const areas = data.areas.map(area => {
      const members = data.miembros.filter(m => m.Area === area.Codigo && !m.HastaUtc)
      const leader = data.encargados.find(m => m.Area === area.Codigo && !m.HastaUtc)
      return { ...area, count: members.length, leader, unassigned: !leader || !members.length }
    })
    return { areas, needsSetup: areas.filter(a => a.unassigned).length, employees: data.empleados.filter(e => e.Activo).length }
  }, [data])

  return <div className="space-y-8">
    <header className="rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 p-7 text-white shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-blue-100">Administración</p><h1 className="mt-2 text-3xl font-bold">¿Qué necesitás gestionar?</h1><p className="mt-2 max-w-2xl text-blue-50">Elegí un grupo de tareas. La operación diaria y la aprobación de trabajos se gestionan desde cada área.</p></header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">No se pudo cargar el estado de la organización: {error}</p>}
    {setup && <section aria-label="Estado de configuración" className="grid gap-3 sm:grid-cols-2"><div className="card"><p className="text-sm text-gray-500">Empleados activos</p><p className="mt-1 text-2xl font-bold">{setup.employees}</p></div><div className={`card ${setup.needsSetup ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50'}`}><p className="text-sm text-gray-600">Áreas que requieren configuración</p><p className="mt-1 text-2xl font-bold">{setup.needsSetup}</p><Link to="/admin/organizacion" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">{setup.needsSetup ? 'Completar organización laboral →' : 'Revisar organización →'}</Link></div></section>}
    {setup?.needsSetup > 0 && <section className="card"><h2 className="font-semibold">Configuración pendiente por área</h2><ul className="mt-3 divide-y">{setup.areas.filter(a => a.unassigned).map(a => <li key={a.Codigo} className="flex flex-wrap justify-between gap-2 py-3"><span>{a.Nombre}</span><span className="text-sm text-amber-800">{!a.count ? 'Sin integrantes' : 'Sin encargado'}</span></li>)}</ul></section>}
    <div className="space-y-7">{groups.map(group => <section key={group.title}><div className="mb-3"><h2 className="text-xl font-bold">{group.title}</h2><p className="text-sm text-gray-600">{group.intro}</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.links.map(([to, title, description]) => <Link key={to} to={to} className="card group border transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><h3 className="font-semibold text-blue-800 group-hover:text-blue-900">{title}<span aria-hidden="true" className="ml-2">→</span></h3><p className="mt-2 text-sm leading-6 text-gray-600">{description}</p></Link>)}</div></section>)}</div>
  </div>
}
