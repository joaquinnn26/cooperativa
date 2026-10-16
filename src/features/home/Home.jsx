import React, { useEffect, useRef } from 'react'
import { ArrowRight, Building2, Clock3, Cross, Droplet, Flame, HeartHandshake, Info, MapPin, Megaphone, Phone, PlayCircle, Settings, Wifi, X, Zap } from 'lucide-react'
import './Home.css'
import PublicNews from './PublicNews.jsx'
import sedePhoto from '@/assets/images/cospral-sede.png'

// Render only when a real team photograph is provided; no placeholder is shown.
const teamImages = import.meta.glob('../../assets/images/cospral-equipo.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const teamPhoto = Object.values(teamImages)[0]

const services = [
  { name: 'Agua potable', text: 'Distribución de agua, consumos y atención de reclamos.', icon: Droplet, tone: 'water' },
  { name: 'Energía eléctrica', text: 'Suministro de energía y atención del servicio.', icon: Zap, tone: 'energy' },
  { name: 'Internet', text: 'Conectividad y atención en turnos de mañana y tarde.', icon: Wifi, tone: 'internet' },
  { name: 'Gas natural', text: 'Información sobre la modalidad de gestión y atención en la cooperativa.', icon: Flame, tone: 'gas' },
  { name: 'Ortopedia', text: 'Consultá en la sede la modalidad de atención de este servicio.', icon: Cross, tone: 'health' },
  { name: 'Sepelio', text: 'Atención a las familias. Servicio tercerizado.', icon: HeartHandshake, tone: 'funeral' }
]
const contacts = [
  { name: 'Agua potable', number: '2302 690326', icon: Droplet },
  { name: 'Energía eléctrica', number: '2302 606821', icon: Zap },
  { name: 'Internet', hours: 'Turno mañana · 06:30 a 13:30', number: '2302 609000', icon: Wifi },
  { name: 'Internet', hours: 'Turno tarde · 15:30 a 20:30', number: '2302 400698', icon: Wifi },
  { name: 'Sepelio', hours: 'Servicio tercerizado', number: '2302 600649', icon: HeartHandshake }
]
function SectionHeading({ icon: Icon, title, children }) {
  return <div className="public-section-heading"><span className="public-heading-icon"><Icon size={26} aria-hidden="true" /></span><div><h2>{title}</h2><p>{children}</p></div></div>
}
function Telephone({ number }) {
  return <a className="public-phone" href={`tel:+54${number.replace(/\s/g, '')}`}>{number}</a>
}
export default function Home() {
  const historyDialog = useRef(null)
  const historyButton = useRef(null)
  const restoreScroll = useRef(null)
  useEffect(() => () => restoreScroll.current?.(), [])

  const openHistory = () => {
    const rootOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    historyDialog.current.showModal()
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    restoreScroll.current = () => {
      document.documentElement.style.overflow = rootOverflow
      document.body.style.overflow = bodyOverflow
      restoreScroll.current = null
    }
  }
  const closeHistory = () => {
    restoreScroll.current?.()
    historyButton.current?.focus({ preventScroll: true })
  }
  return <div className="public-home">
    <section className="public-hero" aria-labelledby="public-home-title">
      <div className="public-home-container">
        <p className="public-eyebrow">COOPERATIVA DE RANCUL</p>
        <h1 id="public-home-title">Servicios esenciales<br />para <span>nuestra comunidad</span></h1>
        <p className="public-hero-description">Trabajamos cada día para brindar agua, energía y otros servicios que mejoran la calidad de vida de nuestros socios y de toda la localidad.</p>
        <div className="public-hero-actions"><button ref={historyButton} type="button" onClick={openHistory} aria-haspopup="dialog" aria-controls="history-dialog" className="public-button public-button-outline">Conocé la cooperativa<ArrowRight size={18} /></button></div>
      </div>
    </section>
    <div className="public-home-container public-home-content">
      <section id="tutorial-socios" className="public-panel public-tutorial" aria-label="Cómo usar SocioAPP">
        <div>
          <SectionHeading icon={PlayCircle} title="Cómo usar SocioAPP">Un recorrido por el portal para socios, con narración y subtítulos en castellano.</SectionHeading>
          <p className="public-tutorial-description">Aprendé a consultar tus servicios, facturas y mediciones, solicitar turnos, realizar reclamos y usar el asistente de ayuda.</p>
          <p className="public-tutorial-note">Duración: 3 minutos y 19 segundos. Las pantallas muestran una cuenta de ejemplo; tus datos pueden ser diferentes.</p>
        </div>
        <video className="public-tutorial-video" controls preload="none" playsInline poster={`${import.meta.env.BASE_URL}tutoriales/tutorial-socios-portada.png`} aria-label="Video tutorial para socios de SocioAPP Rancul">
          <source src={`${import.meta.env.BASE_URL}tutoriales/tutorial-socios.mp4`} type="video/mp4" />
          Tu navegador no permite reproducir este video. <a href={`${import.meta.env.BASE_URL}tutoriales/tutorial-socios.mp4`}>Descargá el tutorial para socios</a>.
        </video>
      </section>
      <div className="public-upper-grid">
        <section className="public-panel" aria-label="Anuncios Importantes">
          <SectionHeading icon={Megaphone} title="Anuncios Importantes">Información importante para la comunidad.</SectionHeading>
          <PublicNews />
        </section>
        <section id="servicios" className="public-panel">
          <SectionHeading icon={Settings} title="Nuestros servicios">Una amplia gama de servicios para tu hogar y tu familia.</SectionHeading>
          <div className="public-services-grid">{services.map(({ name, text, icon: Icon, tone }) => <article key={name} className={`public-service public-service-${tone}`}><span className="public-service-icon"><Icon size={25} aria-hidden="true" /></span><div><h3>{name}</h3><p>{text}</p></div></article>)}</div>
        </section>
      </div>
      <dialog ref={historyDialog} id="history-dialog" className="public-history-dialog" aria-labelledby="public-history-title" onClose={closeHistory}>
        <div className="public-history-dialog-header"><div className="public-section-heading"><span className="public-heading-icon"><HeartHandshake size={26} aria-hidden="true" /></span><h2 id="public-history-title">Nuestra historia</h2></div><button type="button" className="public-history-close" aria-label="Cerrar historia" autoFocus onClick={() => historyDialog.current.close()}><X size={22} /></button></div>
        <div className={`public-history-body${teamPhoto ? ' public-history-with-photo' : ''}`}>
          <div className="public-history-text">
            <p>La Cooperativa de Servicios Públicos (COSPRAL) fue fundada hace más de 50 años por un grupo de vecinos de La Pampa que buscaban garantizar el acceso equitativo y sustentable a los servicios esenciales.</p>
            <p>En sus inicios, la cooperativa se enfocó en la distribución de energía eléctrica dentro de la localidad, operando con recursos limitados y un pequeño equipo de trabajo comprometido con la comunidad.</p>
            <p>Con el paso del tiempo, COSPRAL amplió su alcance incorporando nuevos servicios, como agua potable, televisión por cable, telefonía e internet, respondiendo a las necesidades tecnológicas y sociales de los habitantes.</p>
            <p>Gracias a su crecimiento sostenido, hoy cuenta con una estructura organizativa formal y una red de empleados capacitados que permiten una gestión más eficiente.</p>
            <p>Actualmente, la cooperativa sigue siendo un actor clave en la región, brindando servicios a los socios, impulsando el desarrollo local y apostando a la innovación mediante la modernización de sus sistemas internos y la digitalización de procesos administrativos.</p>
            <p>La cooperativa se ha consolidado gracias al compromiso de sus autoridades y empleados, quienes sostienen su funcionamiento diario.</p>
          </div>
          {teamPhoto && <figure className="public-history-team"><img src={teamPhoto} alt="Equipo actual de trabajo de la cooperativa C.O.S.P.R.A.L." loading="lazy" /><figcaption>El equipo que acompaña a nuestra comunidad.</figcaption></figure>}
        </div>
      </dialog>
      <div className="public-lower-grid">
        <section id="atencion" className="public-panel">
          <SectionHeading icon={Phone} title="Atención y guardias">Teléfonos útiles y horarios de atención.</SectionHeading>
          <div className="public-attention-grid">
            <article className="public-office"><Building2 size={27} aria-hidden="true" /><h3>Sede administrativa</h3><div><Clock3 size={20} aria-hidden="true" /><p>Lunes a viernes<strong>06:30 a 12:30</strong></p></div><div><Phone size={19} aria-hidden="true" /><Telephone number="2302 412698" /></div></article>
            <div className="public-contacts"><h3>Contactos por servicio</h3><ul>{contacts.map(({ name, hours, number, icon: Icon }) => <li key={number}><Icon size={18} aria-hidden="true" /><div><span>{name}</span>{hours && <small>{hours}</small>}</div><Telephone number={number} /></li>)}</ul></div>
          </div>
          <p className="public-guard"><Info size={23} aria-hidden="true" /><span>La cooperativa cuenta con guardia pasiva permanente. Se reciben reclamos de los distintos servicios fuera del horario habitual, aunque en situaciones excepcionales la atención o reparación puede postergarse.</span></p>
        </section>
        <section className="public-panel public-location">
          <SectionHeading icon={MapPin} title="Ubicación">Nuestra sede administrativa.</SectionHeading>
          <img className="public-location-photo" src={sedePhoto} alt="Fachada de la sede administrativa de C.O.S.P.R.A.L., en Mitre 587, Rancul, La Pampa" loading="lazy" />
          <div className="public-location-details"><MapPin size={23} aria-hidden="true" /><div><address>Mitre 587, Rancul, La Pampa, Argentina.</address><p>Sede administrativa de C.O.S.P.R.A.L.</p><p className="public-location-hours"><Clock3 size={16} aria-hidden="true" />Lunes a viernes de 06:30 a 12:30.</p></div></div>
          <a className="public-button public-map-button" href="https://www.google.com/maps/search/?api=1&query=Mitre%20587%2C%20Rancul%2C%20La%20Pampa%2C%20Argentina" target="_blank" rel="noopener noreferrer">Cómo llegar<ArrowRight size={17} /></a>
        </section>
      </div>
    </div>
  </div>
}
