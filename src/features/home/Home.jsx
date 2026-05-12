import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Droplet, Zap, Check, BookOpen, HelpCircle, Phone } from 'lucide-react'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { formatDate } from '@/utils/formatDate.js'

export default function Home() {
  const fetchAnnouncements = useCooperativeStore((state) => state.fetchAnnouncements)
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    fetchAnnouncements().then(setAnnouncements)
  }, [fetchAnnouncements])

  const playTutorial = () => {
    console.log('Reproducir tutorial')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Bienvenido a la Cooperativa</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Portal web para socios de agua y luz
            </p>

            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-white rounded-xl shadow-2xl p-4">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-xl font-semibold mb-2">Tutorial de Uso</h3>
                    <p className="text-gray-300">Aprende a usar el portal paso a paso</p>
                    <button
                      type="button"
                      onClick={playTutorial}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Ver Tutorial
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nuestros Servicios</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Droplet className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Servicio de Agua</h3>
              <p className="text-gray-600 mb-6 text-lg">Gestión completa del servicio de agua potable</p>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Consulta de consumos
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Pago de facturas
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Reporte de problemas
                </li>
              </ul>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Servicio de Luz</h3>
              <p className="text-gray-600 mb-6 text-lg">Control y gestión del servicio eléctrico</p>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Monitoreo de consumo
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Pago en línea
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Solicitud de servicios
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">¿Necesitas Ayuda?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Guía de Uso</h3>
              <p className="text-gray-600 mb-6">Aprende a usar todas las funciones del portal</p>
              <Link to="/ayuda/guia" className="btn-primary">
                Ver Guía
              </Link>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h3>
              <p className="text-gray-600 mb-6">Respuestas a las preguntas más comunes</p>
              <Link to="/ayuda/faq" className="btn-primary">
                Ver FAQ
              </Link>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contacto</h3>
              <p className="text-gray-600 mb-6">Contáctanos si necesitas ayuda personalizada</p>
              <Link to="/contacto" className="btn-primary">
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Anuncios Importantes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`card border-l-4 ${
                  announcement.priority === 'high' ? 'border-red-500' : 'border-blue-500'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                    <p className="text-gray-600 mb-4">{announcement.content}</p>
                    <p className="text-sm text-gray-500">{formatDate(announcement.date)}</p>
                  </div>
                  {announcement.priority === 'high' && (
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                      Urgente
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
