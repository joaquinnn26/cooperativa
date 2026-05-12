import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function BackToSocioDashboard() {
  return (
    <Link
      to="/socio"
      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Volver al panel
    </Link>
  )
}
