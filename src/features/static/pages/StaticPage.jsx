import React from 'react'
import Placeholder from '@/components/Placeholder.jsx'

export function Servicios() {
  return <Placeholder title="Servicios" description="Configura y consulta tus servicios aquí." />
}

export function Facturas() {
  return <Placeholder title="Facturas" description="Listado de facturas y pagos." />
}

export function Contacto() {
  return (
    <Placeholder title="Contacto" description="Contáctanos en info@cooperativa.com o (555) 123-4567." />
  )
}

export function Terminos() {
  return <Placeholder title="Términos y Condiciones" description="Contenido legal pendiente." />
}

export function Guia() {
  return <Placeholder title="Reportaje de Emiliano" description= "este es el inicio de mi trabajo "/>
}

export function FAQ() {
  return <Placeholder title="Preguntas frecuentes" description="Listado de preguntas frecuentes en preparación." />
}

export function NotFound() {
  return <Placeholder title="404" description="La página solicitada no existe." />
}
