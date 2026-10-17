import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Edit3, Megaphone, Pin, PlusCircle, Trash2, X } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { announcementDateLabel as formatDate, announcementPublicationDateLabel, announcementDay, announcementState, validAnnouncementDay as isValidDate } from '@/features/home/announcementRules.js'
import { cleanText, FIELD_LIMITS, firstValidationError, validateMeaningfulText } from '@/utils/validation.js'

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
  return announcementDay(value)
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
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [listError, setListError] = useState('')
  const [now, setNow] = useState(Date.now())
  const busy = useRef(false)
  const uncertain = useCooperativeStore(state => state.announcementOutcomeUncertain)
  const blocked = saving || loading || uncertain || Boolean(listError)

  const loadAnnouncements = async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await fetchAnnouncementsAdmin()
      setAnuncios(data)
    } catch (err) {
      setListError(err.message || 'No se pudieron cargar los anuncios.')
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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showForm) return
    const close = event => { if (event.key === 'Escape' && !busy.current) resetForm() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [showForm])

  const summary = useMemo(
    () => anuncios.reduce((result, item) => { result[announcementState(item, now)]++; return result }, { current: 0, scheduled: 0, expired: 0, inactive: 0 }),
    [anuncios, now]
  )

  const resetForm = () => {
    if (busy.current) return
    setShowForm(false)
    setForm(initialForm)
    setEditingId(null)
    setError('')
  }

  const editAnnouncement = (anuncio) => {
    if (busy.current || blocked) return
    setShowForm(true)
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
    if (busy.current || uncertain) return

    const validationError = validateAnnouncement(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      ...form,
      title: cleanText(form.title),
      content: cleanText(form.content)
    }

    busy.current = true
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateAnnouncement(editingId, payload)
      } else {
        await createAnnouncement(payload)
      }

      busy.current = false
      resetForm()
      addNotification({
        title: editingId ? 'Anuncio actualizado' : 'Anuncio guardado',
        message: 'La API confirmó el guardado del anuncio.',
        type: 'success'
      })
      await loadAnnouncements()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el anuncio.')
      if (err.uncertain) {
        busy.current = false
        resetForm()
        addNotification({ title: 'Resultado sin confirmar', message: err.message, type: 'error' })
        await loadAnnouncements()
      }
      if (err.status === 409) await loadAnnouncements()
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  const disableAnnouncement = async (anuncio) => {
    if (busy.current || blocked) return
    busy.current = true
    setSaving(true)
    try {
      await deactivateAnnouncement(anuncio.id)
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
      if (err.uncertain || err.status === 409) await loadAnnouncements()
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anuncios</h1>
          <p className="mt-2 text-gray-600">Publica comunicados visibles para socios y visitantes del portal.</p>
        </div>
        <button type="button" disabled={blocked} onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary disabled:opacity-50"><PlusCircle className="mr-2 h-4 w-4" />Nuevo anuncio</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries({ current: 'Vigentes', scheduled: 'Programados', expired: 'Vencidos', inactive: 'Inactivos' }).map(([state, label]) => <div key={state} className="card"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-blue-700">{summary[state]}</p></div>)}
      </div>
      {(listError || uncertain) && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700"><p>{listError || 'El último resultado no pudo confirmarse. Actualizá el listado antes de continuar.'}</p><button type="button" disabled={loading || saving} onClick={loadAnnouncements} className="mt-2 underline">Actualizar listado</button></div>}

      <div className="space-y-6">
        {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) resetForm() }}><form role="dialog" aria-modal="true" aria-labelledby="announcement-modal-title" onSubmit={submitAnnouncement} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="announcement-modal-title" className="text-xl font-bold text-gray-900">{editingId ? 'Editar anuncio' : 'Nuevo anuncio'}</h2>
              <p className="mt-1 text-sm text-gray-500">Usá fechas para indicar el inicio y la finalización del anuncio. La vigencia la determina la API.</p>
            </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                disabled={saving} aria-label="Cerrar formulario"
              >
                <X className="h-4 w-4" />
              </button>
          </div>

          <fieldset disabled={saving || uncertain} className="space-y-4">
          <input
            autoFocus
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
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : !form.active ? 'Guardar inactivo' : announcementState(form) === 'scheduled' ? 'Programar anuncio' : announcementState(form) === 'expired' ? 'Guardar vencido' : 'Publicar anuncio'}
          </button>
          </fieldset>
        </form></div>}

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
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">{{ current: 'Vigente', scheduled: 'Programado', expired: 'Vencido', inactive: 'Inactivo' }[announcementState(anuncio, now)]}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{anuncio.content}</p>
                      <p className="mt-3 text-xs opacity-80">
                        Creado: {announcementPublicationDateLabel(anuncio.date)} · Prioridad: {priorityLabel(anuncio.priority)}
                        {anuncio.startsAt ? ` · Desde: ${formatDate(anuncio.startsAt, 'es-AR')}` : ''}
                        {anuncio.endsAt ? ` · Hasta: ${formatDate(anuncio.endsAt, 'es-AR')}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={blocked}
                        onClick={() => editAnnouncement(anuncio)}
                        className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        <Edit3 className="mr-1 h-4 w-4" />
                        Editar
                      </button>
                      {anuncio.active ? (
                        <button
                          type="button"
                          disabled={blocked} onClick={() => disableAnnouncement(anuncio)}
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
          ) : !listError ? (
            <p className="py-8 text-center text-gray-500">Todavia no hay anuncios cargados.</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
