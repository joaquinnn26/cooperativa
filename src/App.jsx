import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout.jsx'
import Home from '@/features/home/Home.jsx'
import Login from '@/features/auth/pages/Login.jsx'
import Register from '@/features/auth/pages/Register.jsx'
import SocioDashboard from '@/features/socio/pages/SocioDashboard.jsx'
import ReclamosList from '@/features/socio/pages/ReclamosList.jsx'
import ReclamoNuevo from '@/features/socio/pages/ReclamoNuevo.jsx'
import AdminDashboard from '@/features/admin/pages/AdminDashboard.jsx'
import AdminSocios from '@/features/admin/pages/AdminSocios.jsx'
import AdminFacturas from '@/features/admin/pages/AdminFacturas.jsx'
import AdminServicios from '@/features/admin/pages/AdminServicios.jsx'
import AdminPagos from '@/features/admin/pages/AdminPagos.jsx'
import AdminAnuncios from '@/features/admin/pages/AdminAnuncios.jsx'
import AdminReportes from '@/features/admin/pages/AdminReportes.jsx'
import AdminLecturas from '@/features/admin/pages/AdminLecturas.jsx'
import HelpCenter from '@/features/help/pages/HelpCenter.jsx'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import PublicOnlyRoute from '@/components/PublicOnlyRoute.jsx'
import { Servicios, Facturas, Contacto, Terminos, Guia, FAQ, NotFound } from '@/features/static/pages/StaticPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ayuda" element={<HelpCenter />} />
        <Route path="/ayuda/guia" element={<Guia />} />
        <Route path="/ayuda/faq" element={<FAQ />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/terminos" element={<Terminos />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute role="Socio" />}>
          <Route path="/socio" element={<SocioDashboard />} />
          <Route path="/socio/reclamos" element={<ReclamosList />} />
          <Route path="/socio/reclamos/nuevo" element={<ReclamoNuevo />} />
        </Route>

        <Route element={<ProtectedRoute role="Admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/socios" element={<AdminSocios />} />
          <Route path="/admin/facturas" element={<AdminFacturas />} />
          <Route path="/admin/servicios" element={<AdminServicios />} />
          <Route path="/admin/pagos" element={<AdminPagos />} />
          <Route path="/admin/anuncios" element={<AdminAnuncios />} />
          <Route path="/admin/reportes" element={<AdminReportes />} />
          <Route path="/admin/lecturas" element={<AdminLecturas />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
