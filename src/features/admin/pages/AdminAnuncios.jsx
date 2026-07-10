import React, { useEffect, useMemo, useState } from 'react'
import { Bell, Edit3, Megaphone, Pin, PlusCircle, Trash2, X } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { formatDate } from '@/utils/formatDate.js'
import { cleanText, FIELD_LIMITS, firstValidationError, isValidDate, validateMeaningfulText } from '@/utils/validation.js'

const initialForm = {
  title: '',
  content: '',
  priority: 'medium',
  startsAt: '',
  endsAt: '',
  active: true,
  fixed: false
}

function priorityLabel(priority) {
  if (priority === 'high') return 'Alta'
  if (priority === 'low') return 'Baja'
  return 'Media'
}

function priorityClasses(priority) {
  if (priority === 'high') return 'border-red-200 bg-red-50 text-red-800'
  if (priority === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : ''
}

function validateAnnouncement(form) {
  return firstValidationError([
    validateMeaningfulText(form.title, 'El titulo', FIELD_LIMITS.shortTitle),
    validateMeaningfulText(form.content, 'El contenido', FIELD_LIMITS.announcement),
    cleanText(form.title).length > 120 ? 'El titulo no puede superar 120 caracteres.' : '',
    cleanText(form.content).length > 1000 ? 'El contenido no puede superar 1000 caracteres.' : '',
    !['high', 'medium', 'low'].includes(form.priority) ? 'Selecciona una prioridad valida.' : '',
    form.startsAt && !isValidDate(form.startsAt) ? 'La fecha de inicio no es valida.' : '',
    form.endsAt && !isValidDate(form.endsAt) ? 'La fecha de fin no es valida.' : '',
    form.startsAt && form.endsAt && form.endsAt < form.startsAt ? 'La fecha de fin no puede ser anterior al inicio.' : ''
  ])
}

export default function AdminAnuncios() {
  const idEmpleado = useAuthStore((state) => state.idEmpleado)
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchAnnouncementsAdmin = useCooperativeStore((state) => state.fetchAnnouncementsAdmin)
  const createAnnouncement = useCooperativeStore((state) => state.createAnnouncement)
  const updateAnnouncement = useCooperativeStore((state) => state.updateAnnouncement)
  const deactivateAnnouncement = useCooperativeStore((state) => state.deactivateAnnouncement)

  const [anuncios, setAnuncios] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const data = await fetchAnnouncementsAdmin()
      setAnuncios(data)
    } catch (err) {
      addNotification({
        title: 'Error',
        message: err.message || 'No se pudieron cargar los anuncios.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [fetchAnnouncementsAdmin])

  const summary = useMemo(
    () => ({
      active: anuncios.filter((anuncio) => anuncio.active).length,
      fixed: anuncios.filter((anuncio) => anuncio.active && anuncio.fixed).length,
      high: anuncios.filter((anuncio) => anuncio.active && anuncio.priority === 'high').length
    }),
    [anuncios]
  )

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setError('')
  }

  const editAnnouncement = (anuncio) => {
    setEditingId(anuncio.id)
    setForm({
      title: anuncio.title || '',
      content: anuncio.content || '',
      priority: anuncio.priority || 'medium',
      startsAt: toDateInput(anuncio.startsAt),
      endsAt: toDateInput(anuncio.endsAt),
      active: anuncio.active !== false,
      fixed: Boolean(anuncio.fixed)
    })
    setError('')
  }

  const submitAnnouncement = async (event) => {
    event.preventDefault()

    const validationError = validateAnnouncement(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      ...form,
      title: cleanText(form.title),
      content: cleanText(form.content),
      idEmpleado
    }

    try {
      if (editingId) {
        await updateAnnouncement(editingId, payload)
      } else {
        await createAnnouncement(payload)
      }

      await loadAnnouncements()
      resetForm()
      addNotification({
        title: editingId ? 'Anuncio actualizado' : 'Anuncio publicado',
        message: 'El comunicado ya esta disponible segun su configuracion.',
        type: 'success'
      })
    } catch (err) {
      setError(err.message || 'No se pudo guardar el anuncio.')
    }
  }

  const disableAnnouncement = async (id) => {
    try {
      await deactivateAnnouncement(id)
      await loadAnnouncements()
      addNotification({
        title: 'Anuncio desactivado',
        message: 'El comunicado dejo de mostrarse a los socios.',
        type: 'success'
      })
    } catch (err) {
      addNotification({
        title: 'Error',
        message: err.message || 'No se pudo desactivar el anuncio.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anuncios</h1>
          <p className="mt-2 text-gray-600">Publica comunicados visibles para socios y visitantes del portal.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{summary.active}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Fijos</p>
          <p className="mt-2 text-3xl font-bold text-indigo-700">{summary.fixed}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Prioridad alta</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{summary.high}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={submitAnnouncement} className="card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar anuncio' : 'Nuevo anuncio'}</h2>
              <p className="mt-1 text-sm text-gray-500">Usa fechas solo si el aviso debe aparecer en una ventana puntual.</p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                aria-label="Cancelar edicion"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Titulo del comunicado"
            className="input-field"
            minLength={FIELD_LIMITS.shortTitle.min}
            maxLength={FIELD_LIMITS.shortTitle.max}
            required
          />

          <textarea
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="Detalle del anuncio"
            className="input-field min-h-32"
            minLength={FIELD_LIMITS.announcement.min}
            maxLength={FIELD_LIMITS.announcement.max}
            required
          />

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="input-field"
            >
              <option value="high">Prioridad alta</option>
              <option value="medium">Prioridad media</option>
              <option value="low">Prioridad baja</option>
            </select>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.fixed}
                onChange={(event) => setForm((prev) => ({ ...prev, fixed: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              Mostrar fijo arriba
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm text-gray-600">
              <span>Desde</span>
              <input
                type="date"
                value={form.startsAt}
                onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                className="input-field"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-600">
              <span>Hasta</span>
              <input
                type="date"
                value={form.endsAt}
                onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                className="input-field"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            Anuncio activo
          </label>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {editingId ? 'Guardar cambios' : 'Publicar anuncio'}
          </button>
        </form>

        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Comunicados cargados</h2>
              <p className="text-sm text-gray-500">Los activos y vigentes se muestran en el portal.</p>
            </div>
            <Bell className="h-5 w-5 text-blue-600" />
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">Cargando anuncios...</p>
          ) : anuncios.length ? (
            <div className="space-y-3">
              {anuncios.map((anuncio) => (
                <article
                  key={anuncio.id}
                  className={`rounded-lg border p-4 ${anuncio.active ? priorityClasses(anuncio.priority) : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        <h3 className="font-semibold">{anuncio.title}</h3>
                        {anuncio.fixed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs font-semibold">
                            <Pin className="h-3 w-3" />
                            Fijo
                          </span>
                        ) : null}
                        {!anuncio.active ? (
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">Inactivo</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6">{anuncio.content}</p>
                      <p className="mt-3 text-xs opacity-80">
                        Publicado: {formatDate(anuncio.date, 'es-AR')} · Prioridad: {priorityLabel(anuncio.priority)}
                        {anuncio.startsAt ? ` · Desde: ${formatDate(anuncio.startsAt, 'es-AR')}` : ''}
                        {anuncio.endsAt ? ` · Hasta: ${formatDate(anuncio.endsAt, 'es-AR')}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => editAnnouncement(anuncio)}
                        className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        <Edit3 className="mr-1 h-4 w-4" />
                        Editar
                      </button>
                      {anuncio.active ? (
                        <button
                          type="button"
                          onClick={() => disableAnnouncement(anuncio.id)}
                          className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Desactivar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">Todavia no hay anuncios cargados.</p>
          )}
        </section>
      </div>
    </div>
  )
}
