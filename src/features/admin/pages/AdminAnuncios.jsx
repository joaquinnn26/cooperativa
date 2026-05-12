import React, { useState } from 'react'
import { Megaphone, PlusCircle } from 'lucide-react'
import { formatDate } from '@/utils/formatDate.js'

const seed = [
  { id: 1, title: 'Mantenimiento programado', content: 'Corte de agua viernes 8-12 hs', date: '2024-01-20', priority: 'high' },
  { id: 2, title: 'Nuevos horarios', content: 'Oficina abre 9 a 17', date: '2024-01-18', priority: 'medium' }
]

export default function AdminAnuncios() {
  const [anuncios, setAnuncios] = useState(seed)
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium' })

  const add = (e) => {
    e.preventDefault()
    const nuevo = { ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) }
    setAnuncios((prev) => [nuevo, ...prev])
    setForm({ title: '', content: '', priority: 'medium' })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anuncios</h1>
          <p className="text-gray-600">Publica comunicados para socios</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={add} className="grid gap-4 md:grid-cols-3">
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Título"
            className="input-field md:col-span-1"
          />
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Contenido"
            className="input-field md:col-span-1"
            rows={1}
          />
          <div className="flex items-center gap-2 md:col-span-1">
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              className="input-field"
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <button type="submit" className="btn-primary inline-flex items-center px-4 py-3">
              <PlusCircle className="w-5 h-5 mr-1" />
              Publicar
            </button>
          </div>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {anuncios.map((a) => (
          <div
            key={a.id}
            className={`card border-l-4 ${
              a.priority === 'high' ? 'border-red-500' : a.priority === 'medium' ? 'border-blue-500' : 'border-green-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <Megaphone className="w-6 h-6 text-pink-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                  <span className="text-xs text-gray-500">{formatDate(a.date)}</span>
                </div>
                <p className="text-gray-700 mt-2">{a.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
