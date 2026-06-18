import React from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ClipboardPenLine, Gauge, MapPinned } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { cargoMatches } from '@/utils/auth.js'

export default function EmpleadoDashboard() {
  const cargo = useAuthStore((state) => state.cargo)
  const isLecturista = cargoMatches(cargo, 'Lecturista')
  const isTecnico = cargoMatches(cargo, 'Tecnico')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Empleado</h1>
        <p className="mt-2 text-gray-600">
          {isTecnico
            ? 'Consulta solicitudes tecnicas y la direccion de instalacion.'
            : 'Carga lecturas y consulta medidores instalados.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLecturista ? (
          <>
            <Link to="/empleado/hoja-ruta" className="card flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                <MapPinned className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Mi hoja de ruta</h2>
                <p className="text-sm text-gray-600">Inicia el recorrido, carga mediciones y firma al finalizar.</p>
              </div>
            </Link>

            <Link to="/empleado/mediciones" className="card flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
                <ClipboardPenLine className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Carga manual</h2>
                <p className="text-sm text-gray-600">Busca medidores y registra lecturas fuera de una ruta.</p>
              </div>
            </Link>
          </>
        ) : null}

        {isTecnico ? (
          <Link to="/empleado/solicitudes-tecnicas" className="card flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Solicitudes Tecnicas</h2>
              <p className="text-sm text-gray-600">Revisa estados pendientes y la direccion donde debe instalarse el servicio.</p>
            </div>
          </Link>
        ) : null}

        <div className="card flex items-center gap-4">
          <div className="rounded-full bg-amber-100 p-3 text-amber-700">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Trabajo en campo</h2>
            <p className="text-sm text-gray-600">
              {isTecnico
                ? 'Las instalaciones pendientes mostraran el estado de la solicitud y la direccion.'
                : 'Las lecturas quedaran asociadas al medidor y al socio.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
