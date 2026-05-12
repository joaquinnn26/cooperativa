import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, HelpCircle, Phone, Mail, MapPin } from 'lucide-react'

export default function HelpCenter() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Centro de Ayuda</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/ayuda/guia" className="card text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Guía de Uso</h2>
          <p className="text-gray-600">Aprende a usar todas las funciones del portal</p>
        </Link>

        <Link to="/ayuda/faq" className="card text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preguntas Frecuentes</h2>
          <p className="text-gray-600">Resuelve dudas comunes</p>
        </Link>

        <Link to="/contacto" className="card text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contacto</h2>
          <p className="text-gray-600">Habla con nuestro equipo</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HelpCard
          color="blue"
          title="Cómo Iniciar Sesión"
          steps={[
            'Ve a la página de inicio y haz clic en "Iniciar Sesión".',
            'Ingresa tu correo electrónico y contraseña.',
            'Haz clic en "Iniciar Sesión".'
          ]}
        />
        <HelpCard
          color="green"
          title="Cómo Ver Mis Facturas"
          steps={[
            'Inicia sesión con tu cuenta.',
            'Ve a la sección "Facturas".',
            'Revisa tus facturas pendientes y pagadas.'
          ]}
        />
        <HelpCard
          color="purple"
          title="Cómo Pagar una Factura"
          steps={[
            'Selecciona la factura que deseas pagar.',
            'Haz clic en el botón "Pagar".',
            'Confirma la transacción.'
          ]}
        />
        <HelpCard
          color="red"
          title="Cómo Reportar un Problema"
          steps={[
            'Accede a la sección de reclamos.',
            'Describe el problema con detalle.',
            'Envía el reporte.'
          ]}
        />
      </div>

      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">¿Necesitas Más Ayuda?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Phone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Teléfono</h3>
            <p className="text-gray-600">(555) 123-4567</p>
            <p className="text-sm text-gray-500">Lunes a Viernes 8:00 - 17:00</p>
          </div>

          <div className="text-center">
            <Mail className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600">ayuda@cooperativa.com</p>
            <p className="text-sm text-gray-500">Respuesta en 24 horas</p>
          </div>

          <div className="text-center">
            <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Oficina</h3>
            <p className="text-gray-600">Av. Principal 123</p>
            <p className="text-sm text-gray-500">Ciudad, Estado</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HelpCard({ title, steps, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div className="flex items-start" key={idx}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 ${colors[color]}`}>
              <span className="font-semibold text-sm">{idx + 1}</span>
            </div>
            <p className="text-gray-700">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
