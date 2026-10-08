import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Droplet,
  FileText,
  Headphones,
  Phone,
  ShieldCheck,
  Zap
} from 'lucide-react'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { formatDate } from '@/utils/formatDate.js'
import cospralLogo from '@/assets/cospral-wordmark.png'

const services = [
  {
    title: 'Agua potable',
    description: 'Consultá tus consumos, revisá facturas y gestioná solicitudes del servicio.',
    icon: Droplet,
    color: 'blue',
    items: ['Consulta de consumos', 'Facturas y pagos', 'Reclamos y solicitudes']
  },
  {
    title: 'Energía eléctrica',
    description: 'Encontrá en un solo lugar la información y las gestiones de tu servicio eléctrico.',
    icon: Zap,
    color: 'amber',
    items: ['Seguimiento del servicio', 'Consulta de facturación', 'Solicitud de servicios']
  }
]

const helpLinks = [
  { title: 'Guía de uso', description: 'Conocé paso a paso las funciones del portal.', to: '/ayuda/guia', label: 'Ver la guía', icon: BookOpen, color: 'teal' },
  { title: 'Preguntas frecuentes', description: 'Encontrá respuestas a consultas habituales.', to: '/ayuda/faq', label: 'Consultar FAQ', icon: CircleHelp, color: 'blue' },
  { title: 'Atención y contacto', description: 'Escribinos si necesitás ayuda personalizada.', to: '/contacto', label: 'Contactar', icon: Phone, color: 'amber' }
]

export default function Home() {
  const fetchAnnouncements = useCooperativeStore((state) => state.fetchAnnouncements)
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
  }, [fetchAnnouncements])

  return (
    <main className="overflow-hidden bg-slate-50">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 text-white">
        <div className="pointer-events-none absolute -right-28 -top-40 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 left-1/4 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-cyan-100 backdrop-blur">
              <ShieldCheck size={15} /> Servicios para nuestra comunidad
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Agua y energía, <span className="text-cyan-300">más cerca tuyo.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200 sm:text-xl">
              Ingresá al portal de COSPRAL para consultar tus servicios, realizar gestiones y seguir tus solicitudes desde un mismo lugar.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-teal-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
                Ingresar al portal <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30">
                Crear cuenta de socio
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-300" /> Gestiones en línea</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-300" /> Información en un solo lugar</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -inset-5 rounded-[2rem] bg-cyan-300/10 blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-white/50 bg-white p-5 text-slate-800 shadow-2xl shadow-black/25 sm:p-7">
              <div className="flex min-h-20 items-center justify-center rounded-2xl bg-slate-50 px-5 py-3">
                <img src={cospralLogo} alt="COSPRAL · Cooperativa de Agua y Luz" className="h-auto w-64 max-w-full object-contain" />
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-teal-700">Tu portal de servicios</p><h2 className="mt-1 text-xl font-bold">Todo más simple</h2></div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><FileText size={21} /></span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:-translate-y-1 hover:shadow-md">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><Droplet size={21} /></span>
                  <p className="mt-4 font-semibold text-slate-900">Agua potable</p><p className="mt-1 text-xs leading-5 text-slate-600">Consumos y gestiones</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 transition hover:-translate-y-1 hover:shadow-md">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-600 shadow-sm"><Zap size={21} /></span>
                  <p className="mt-4 font-semibold text-slate-900">Electricidad</p><p className="mt-1 text-xs leading-5 text-slate-600">Información y atención</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-white">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300"><ShieldCheck size={19} /></span>
                <p className="text-sm leading-5 text-slate-200">Un espacio para acompañarte en cada gestión.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Nuestros servicios</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Lo que necesitás, a mano</h2>
            <p className="mt-4 text-slate-600">Accedé a la información de tus servicios y resolvé tus gestiones desde el portal.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {services.map(({ title, description, icon: Icon, color, items }) => (
              <article key={title} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div><span className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Servicio</span><h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3></div>
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl ${color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-600'}`}><Icon size={27} /></span>
                </div>
                <p className="mt-4 max-w-lg leading-7 text-slate-600">{description}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {items.map((item) => <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check size={13} /></span>{item}</li>)}
                </ul>
                <Link to="/servicios" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 transition group-hover:gap-3">Conocer más <ArrowRight size={16} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">En pocos pasos</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Un portal pensado para vos</h2>
              <p className="mt-4 leading-7 text-slate-600">Ingresá con tu cuenta para ver tus servicios y mantenerte al día con tus trámites.</p>
              <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200">Ingresar ahora <ArrowRight size={17} /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['01', 'Ingresá', 'Usá tu cuenta o registrate como socio.'],
                ['02', 'Elegí tu gestión', 'Consultá facturas, consumos y servicios.'],
                ['03', 'Seguí el estado', 'Revisá novedades y avances de tus solicitudes.']
              ].map(([number, title, description]) => (
                <article key={number} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50/60">
                  <span className="text-sm font-bold tracking-widest text-teal-700">{number}</span><h3 className="mt-5 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Estamos para ayudarte</span><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">¿Necesitás una mano?</h2></div>
            <p className="max-w-xl text-slate-600">Encontrá orientación para usar el portal o contactá al equipo de atención.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {helpLinks.map(({ title, description, to, label, icon: Icon, color }) => (
              <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${color === 'teal' ? 'bg-teal-50 text-teal-700' : color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}><Icon size={21} /></span>
                <h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
                <Link to={to} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-800">{label}<ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><span className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Novedades</span><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Anuncios importantes</h2></div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">Información de la cooperativa</span>
          </div>
          {announcements.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {announcements.map((announcement) => (
                <article key={announcement.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${announcement.priority === 'high' ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-bold text-slate-900">{announcement.title}</h3><p className="mt-2 leading-6 text-slate-600">{announcement.content}</p><p className="mt-4 text-xs text-slate-500">{formatDate(announcement.date)}</p></div>
                    {announcement.priority === 'high' && <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Importante</span>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <Headphones className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-medium text-slate-700">No hay anuncios activos por el momento.</p><p className="mt-1 text-sm text-slate-500">Volvé a consultar para enterarte de las novedades.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
