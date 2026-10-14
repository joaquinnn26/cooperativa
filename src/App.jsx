import LaboralPanel from '@/features/empleado/pages/LaboralPanel.jsx'
import LaboralTarea from '@/features/empleado/pages/LaboralTarea.jsx'
import LaboralFacturas from '@/features/empleado/pages/LaboralFacturas.jsx'
import LaboralAtencion from '@/features/empleado/pages/LaboralAtencion.jsx'
import LaboralTurnos from '@/features/empleado/pages/LaboralTurnos.jsx'
import LaboralLecturas from '@/features/empleado/pages/LaboralLecturas.jsx'
import JefeRutas from '@/features/empleado/pages/JefeRutas.jsx'
import AdminOrganizacionLaboral from '@/features/admin/pages/AdminOrganizacionLaboral.jsx'
import SocioDocumentos from '@/features/socio/pages/SocioDocumentos.jsx'
import SocioAlta from '@/features/socio/pages/SocioAlta.jsx'
import LegajoPersona from '@/features/socio/pages/LegajoPersona.jsx'
import AdminAltasSocio from '@/features/admin/pages/AdminAltasSocio.jsx'
import AdminLegajos from '@/features/admin/pages/AdminLegajos.jsx'
import EventosEstadisticas from '@/features/admin/pages/EventosEstadisticas.jsx'
import AdminMotivosEventos from '@/features/admin/pages/AdminMotivosEventos.jsx'
import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout.jsx'
import Home from '@/features/home/Home.jsx'
import Login from '@/features/auth/pages/Login.jsx'
import RecoverPassword from '@/features/auth/pages/RecoverPassword.jsx'
import Register from '@/features/auth/pages/Register.jsx'
import SocioDashboard from '@/features/socio/pages/SocioDashboard.jsx'
import ReclamosList from '@/features/socio/pages/ReclamosList.jsx'
import ReclamoNuevo from '@/features/socio/pages/ReclamoNuevo.jsx'
import SocioSolicitudesServicio from '@/features/socio/pages/SocioSolicitudesServicio.jsx'
import SocioSolicitudServicioNueva from '@/features/socio/pages/SocioSolicitudServicioNueva.jsx'
import SocioBeneficios from '@/features/socio/pages/SocioBeneficios.jsx'
import BeneficiosTercerizados from '@/features/empleado/pages/BeneficiosTercerizados.jsx'
import SocioServicios from '@/features/socio/pages/SocioServicios.jsx'
import SocioMediciones from '@/features/socio/pages/SocioMediciones.jsx'
import SocioFacturas from '@/features/socio/pages/SocioFacturas.jsx'
import SocioPerfil from '@/features/socio/pages/SocioPerfil.jsx'
import MisTurnos from '@/features/socio/pages/MisTurnos.jsx'
import AdminDashboard from '@/features/admin/pages/AdminDashboard.jsx'
import AdminSocios from '@/features/admin/pages/AdminSocios.jsx'
import AdminEmpleados from '@/features/admin/pages/AdminEmpleados.jsx'
import AdminServicios from '@/features/admin/pages/AdminServicios.jsx'
import AdminAnuncios from '@/features/admin/pages/AdminAnuncios.jsx'
import AdminRequisitosServicio from '@/features/admin/pages/AdminRequisitosServicio.jsx'
import AdminMedidores from '@/features/admin/pages/AdminInventarioMedidores.jsx'
import AdminTerritorio from '@/features/admin/pages/AdminTerritorio.jsx'
import EmpleadoHojaRuta from '@/features/empleado/pages/EmpleadoHojaRuta.jsx'
import HelpCenter from '@/features/help/pages/HelpCenter.jsx'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import CargoProtectedRoute from '@/components/CargoProtectedRoute.jsx'
import PublicOnlyRoute from '@/components/PublicOnlyRoute.jsx'
import useAuthStore from '@/store/authStore.js'
import { normalizeRole } from '@/utils/auth.js'
import { Servicios, Contacto, Terminos, Guia, FAQ, NotFound } from '@/features/static/pages/StaticPage.jsx'

function ReclamosRedirect() {
  const rol = useAuthStore((state) => state.rol)
  const normalizedRole = normalizeRole(rol)

  if (normalizedRole === 'Administrador') {
    return <Navigate to="/admin/reclamos" replace />
  }

  if (normalizedRole === 'Socio') {
    return <Navigate to="/socio/reclamos" replace />
  }

  return <Navigate to="/login" replace />
}

function NuevoReclamoRedirect() {
  const rol = useAuthStore((state) => state.rol)
  const normalizedRole = normalizeRole(rol)

  if (normalizedRole === 'Socio') {
    return <Navigate to="/socio/reclamos/nuevo" replace />
  }

  if (normalizedRole === 'Administrador') {
    return <Navigate to="/admin/reclamos" replace />
  }

  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ayuda" element={<HelpCenter />} />
        <Route path="/ayuda/guia" element={<Guia />} />
        <Route path="/ayuda/faq" element={<FAQ />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/facturas" element={<SocioFacturas />} />
        <Route path="/reclamos" element={<ReclamosRedirect />} />
        <Route path="/reclamos/nuevo" element={<NuevoReclamoRedirect />} />
        <Route path="/recuperar-contrasena" element={<RecoverPassword />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/terminos" element={<Terminos />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute role="Socio" />}>
          <Route path="/socio/alta" element={<SocioAlta />} />
          <Route path="/socio/documentos" element={<SocioDocumentos />} />
          <Route path="/socio" element={<SocioDashboard />} />
          <Route path="/socio/reclamos" element={<ReclamosList />} />
          <Route path="/socio/reclamos/nuevo" element={<ReclamoNuevo />} />
          <Route path="/socio/solicitudes-servicio" element={<SocioSolicitudesServicio />} />
          <Route path="/socio/solicitudes-servicio/nueva" element={<SocioSolicitudServicioNueva />} />
          <Route path="/socio/beneficios" element={<SocioBeneficios />} />
          <Route path="/socio/mis-servicios" element={<SocioServicios />} />
          <Route path="/socio/mis-mediciones" element={<SocioMediciones />} />
          <Route path="/socio/perfil" element={<SocioPerfil />} />
          <Route path="/socio/turnos" element={<MisTurnos />} />
          <Route path="/socio/turnos/nuevo" element={<Navigate to="/socio/turnos?nuevo=1" replace />} />
        </Route>

        <Route element={<ProtectedRoute role="Admin" />}>
          <Route path="/admin/altas-socio" element={<AdminAltasSocio />} />
          <Route path="/admin/legajos" element={<AdminLegajos />} />
          <Route path="/admin/organizacion" element={<AdminOrganizacionLaboral />} />
          <Route path="/admin/estadisticas-eventos" element={<EventosEstadisticas />} />
          <Route path="/admin/motivos-eventos" element={<AdminMotivosEventos />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/socios" element={<AdminSocios />} />
          <Route path="/admin/empleados" element={<AdminEmpleados />} />
          <Route path="/admin/facturas" element={<Navigate to="/empleado/facturas" replace />} />
          <Route path="/admin/servicios" element={<AdminServicios />} />
          <Route path="/admin/pagos" element={<Navigate to="/empleado/facturas" replace />} />
          <Route path="/admin/anuncios" element={<AdminAnuncios />} />
          <Route path="/admin/reclamos" element={<Navigate to="/empleado/areas/ADMINISTRACION" replace />} />
          <Route path="/admin/reportes" element={<Navigate to="/empleado/reportes" replace />} />
          <Route path="/admin/lecturas" element={<Navigate to="/empleado/mediciones" replace />} />
          <Route path="/admin/rutas-medicion" element={<Navigate to="/empleado/rutas-medicion" replace />} />
          <Route path="/admin/territorio" element={<AdminTerritorio />} />
          <Route path="/admin/solicitudes-servicio" element={<Navigate to="/empleado/areas/ADMINISTRACION" replace />} />
          <Route path="/admin/requisitos-servicio" element={<AdminRequisitosServicio />} />
          <Route path="/admin/instalaciones" element={<Navigate to="/empleado" replace />} />
          <Route path="/admin/medidores" element={<AdminMedidores />} />
          <Route path="/admin/turnos" element={<Navigate to="/empleado/turnos" replace />} />
        </Route>

        <Route element={<ProtectedRoute roles={['Empleado', 'Administrador']} />}>
          <Route path="/empleado/legajo" element={<LegajoPersona />} />
          <Route element={<CargoProtectedRoute />}>
            <Route path="/empleado" element={<LaboralPanel />} />
            <Route path="/empleado/areas/:area" element={<LaboralPanel />} />
            <Route path="/empleado/tareas/:id" element={<LaboralTarea />} />
            <Route path="/empleado/atencion" element={<LaboralAtencion />} />
            <Route path="/empleado/turnos" element={<LaboralTurnos />} />
            <Route path="/empleado/facturas" element={<LaboralFacturas />} />
            <Route path="/empleado/beneficios" element={<BeneficiosTercerizados />} />
            <Route path="/empleado/hoja-ruta" element={<EmpleadoHojaRuta />} />
            <Route path="/empleado/medidores" element={<AdminMedidores />} />
            <Route path="/empleado/mediciones" element={<LaboralLecturas />} />
            <Route path="/empleado/rutas-medicion" element={<JefeRutas />} />
            <Route path="/empleado/reportes" element={<LaboralPanel gerencia />} />
            <Route path="/empleado/estadisticas-eventos" element={<EventosEstadisticas />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
