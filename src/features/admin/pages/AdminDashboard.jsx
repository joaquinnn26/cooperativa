import React, { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Droplet,
  Zap,
  AlertCircle,
  UserPlus,
  Settings,
  BarChart3,
  Receipt,
  CreditCard,
  Briefcase,
  ClipboardList,
  Megaphone,
  FileText,
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { formatDate } from '@/utils/formatDate.js'
import { apiUrl } from '@/config/api.js'

const estadosMap = {
  Pendiente: 1,
  'En Proceso': 2,
  Resuelto: 3,
  Cancelado: 4
}

export default function AdminDashboard() {
  const [reclamos, setReclamos] = useState([])
  const [modalDetalle, setModalDetalle] = useState(null)

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const res = await fetch(apiUrl('/reclamo'))
        if (res.ok) {
          const data = await res.json()
          setReclamos(
            data.map((r) => ({
              idReclamo: r.idReclamo,
              socioNombre: `${r.Socio?.Nombre ?? ''} ${r.Socio?.Apellido ?? ''}`,
              tipoReclamo: r.Tipo,
              fecha: r.Fecha,
              estado: r.Estado,
              Descripcion: r.Descripcion,
              nuevoEstado: ''
            }))
          )
        } else {
          setReclamos(mockReclamos)
        }
      } catch (error) {
        console.error('Error al cargar reclamos', error)
        setReclamos(mockReclamos)
      }
    }
    fetchReclamos()
  }, [])

  const guardarEstado = async (reclamo) => {
    try {
      const idEstado = estadosMap[reclamo.nuevoEstado]
      if (!idEstado) return alert('Estado no válido')

      await fetch(apiUrl(`/reclamo/${reclamo.idReclamo}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEstadoReclamo: idEstado })
      })

      setReclamos((prev) =>
        prev.map((r) =>
          r.idReclamo === reclamo.idReclamo
            ? { ...r, estado: reclamo.nuevoEstado, nuevoEstado: '' }
            : r
        )
      )
    } catch (error) {
      console.error('Error al cambiar estado', error)
    }
  }

  const stats = useMemo(
    () => [
      { label: 'Socios', value: 1240, icon: Users, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
      { label: 'Reclamos activos', value: reclamos.length, icon: AlertCircle, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
      { label: 'Servicios', value: 2, icon: Settings, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
      { label: 'Facturas pendientes', value: 86, icon: Receipt, bgColor: 'bg-green-100', iconColor: 'text-green-600' }
    ],
    [reclamos.length]
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-lg text-gray-600">Gestiona la cooperativa desde aquí</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div className="card" key={stat.label}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Gestión de Socios</h2>
          <div className="space-y-4">
            <a
              href="/admin/socios"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Ver Todos los Socios</h3>
                <p className="text-sm text-gray-600">Gestionar cuentas de socios</p>
              </div>
            </a>

            <button
              type="button"
              className="w-full flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <UserPlus className="w-8 h-8 text-green-600 mr-4" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Agregar Nuevo Socio</h3>
                <p className="text-sm text-gray-600">Registrar nuevo socio</p>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Gestión de Servicios</h2>
          <div className="space-y-4">
            <a
              href="/admin/servicios"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Settings className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Configurar Servicios</h3>
                <p className="text-sm text-gray-600">Gestionar servicios disponibles</p>
              </div>
            </a>

            <a
              href="/admin/lecturas"
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-orange-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Registrar Lecturas</h3>
                <p className="text-sm text-gray-600">Ingresar lecturas de medidores</p>
              </div>
            </a>

            <a
              href="/admin/requisitos-servicio"
              className="flex items-center p-4 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <FileText className="w-8 h-8 text-violet-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar Requisitos</h3>
                <p className="text-sm text-gray-600">ABM de requisitos por servicio</p>
              </div>
            </a>

            <a
              href="/admin/medidores"
              className="flex items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Zap className="w-8 h-8 text-amber-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar Medidores</h3>
                <p className="text-sm text-gray-600">Instalacion, edicion y estado</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Gestion de Empleados</h2>
          <div className="space-y-4">
            <a
              href="/admin/empleados"
              className="flex items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Briefcase className="w-8 h-8 text-amber-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Administrar Empleados</h3>
                <p className="text-sm text-gray-600">Asignar cargos, editar y dar de baja</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Solicitudes de Servicio</h2>
          <div className="space-y-4">
            <a
              href="/admin/solicitudes-servicio"
              className="flex items-center p-4 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
            >
              <ClipboardList className="w-8 h-8 text-sky-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Revisar Solicitudes</h3>
                <p className="text-sm text-gray-600">Cambiar estado y asignar medidor a servicios de luz</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Reclamos</h1>
            <p className="text-gray-600">Administra y actualiza el estado de los reclamos</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Socio</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Estado Actual</th>
                <th className="px-6 py-3">Nuevo Estado</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reclamos.map((reclamo) => (
                <tr key={reclamo.idReclamo} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-3">{reclamo.idReclamo}</td>
                  <td className="px-6 py-3">{reclamo.socioNombre}</td>
                  <td className="px-6 py-3">{reclamo.tipoReclamo}</td>
                  <td className="px-6 py-3">{formatDate(reclamo.fecha, 'es-AR')}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full font-medium text-xs ${estadoColor(reclamo.estado)}`}>
                      {reclamo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={reclamo.nuevoEstado}
                      onChange={(e) =>
                        setReclamos((prev) =>
                          prev.map((r) =>
                            r.idReclamo === reclamo.idReclamo ? { ...r, nuevoEstado: e.target.value } : r
                          )
                        )
                      }
                      className="border rounded px-2 py-1 text-sm focus:ring focus:ring-blue-200"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setModalDetalle(reclamo)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => guardarEstado(reclamo)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                      disabled={!reclamo.nuevoEstado || reclamo.nuevoEstado === reclamo.estado}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reclamos.length && (
            <div className="text-center py-10 text-gray-500">No hay reclamos registrados</div>
          )}
        </div>
      </div>

      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              type="button"
              onClick={() => setModalDetalle(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Detalle del Reclamo</h2>

            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {modalDetalle.idReclamo}
              </p>
              <p>
                <strong>Socio:</strong> {modalDetalle.socioNombre}
              </p>
              <p>
                <strong>Tipo:</strong> {modalDetalle.tipoReclamo}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDate(modalDetalle.fecha, 'es-AR')}
              </p>
              <p>
                <strong>Estado:</strong> {modalDetalle.estado}
              </p>
              <p className="bg-gray-100 p-3 rounded text-gray-700">
                {modalDetalle.Descripcion || 'Sin descripción'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Facturación</h2>
          <div className="space-y-4">
            <a
              href="/admin/facturas"
              className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Receipt className="w-8 h-8 text-indigo-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Generar Facturas</h3>
                <p className="text-sm text-gray-600">Crear facturas mensuales</p>
              </div>
            </a>

            <a
              href="/admin/pagos"
              className="flex items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <CreditCard className="w-8 h-8 text-emerald-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Gestionar Pagos</h3>
                <p className="text-sm text-gray-600">Ver y procesar pagos</p>
              </div>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Comunicación</h2>
          <div className="space-y-4">
            <a
              href="/admin/anuncios"
              className="flex items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <Megaphone className="w-8 h-8 text-pink-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Crear Anuncios</h3>
                <p className="text-sm text-gray-600">Publicar comunicados</p>
              </div>
            </a>

            <a
              href="/admin/reportes"
              className="flex items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <FileText className="w-8 h-8 text-teal-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Generar Reportes</h3>
                <p className="text-sm text-gray-600">Estadísticas y análisis</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Actividad Reciente</h2>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${getActivityColor(activity.type)}`}>
                {React.createElement(getActivityIcon(activity.type), { className: 'w-5 h-5' })}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
              <div className="text-sm text-gray-500">{formatTime(activity.timestamp)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const mockReclamos = [
  {
    idReclamo: 1,
    socioNombre: 'María González',
    tipoReclamo: 'Corte de agua',
    fecha: '2024-01-10',
    estado: 'Pendiente',
    Descripcion: 'Sin servicio desde las 8am',
    nuevoEstado: ''
  },
  {
    idReclamo: 2,
    socioNombre: 'Juan Pérez',
    tipoReclamo: 'Medidor eléctrico',
    fecha: '2024-01-11',
    estado: 'En Proceso',
    Descripcion: 'Lectura incorrecta',
    nuevoEstado: ''
  }
]

const recentActivities = [
  {
    id: 1,
    type: 'user',
    title: 'Nuevo socio registrado',
    description: 'María González se registró en el sistema',
    timestamp: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: 2,
    type: 'payment',
    title: 'Pago procesado',
    description: 'Factura #1234 pagada por Juan Pérez',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: 3,
    type: 'alert',
    title: 'Reporte de problema',
    description: 'Corte de agua reportado en Calle Principal',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4)
  }
]

const getActivityIcon = (type) => {
  const icons = { user: User, payment: CheckCircle, alert: AlertTriangle }
  return icons[type] || AlertCircle
}

const getActivityColor = (type) => {
  const colors = {
    user: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600',
    alert: 'bg-red-100 text-red-600'
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

const formatTime = (timestamp) => {
  const now = new Date()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 60) return `Hace ${minutes} minutos`
  if (hours < 24) return `Hace ${hours} horas`
  return timestamp.toLocaleDateString('es-ES')
}

const estadoColor = (estado) => {
  switch (estado) {
    case 'Pendiente':
      return 'bg-yellow-100 text-yellow-700'
    case 'En Proceso':
      return 'bg-blue-100 text-blue-700'
    case 'Resuelto':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
