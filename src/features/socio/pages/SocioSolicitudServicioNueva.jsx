import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import FileDropzone from '@/components/FileDropzone.jsx'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'

export default function SocioSolicitudServicioNueva() {
  const navigate = useNavigate()
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchServicesCatalog = useServiceWorkflowStore((state) => state.fetchServicesCatalog)
  const fetchRequirementsByService = useServiceWorkflowStore((state) => state.fetchRequirementsByService)
  const createServiceRequest = useServiceWorkflowStore((state) => state.createServiceRequest)

  const [services, setServices] = useState([])
  const [requirements, setRequirements] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingRequirements, setLoadingRequirements] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    idServicio: '',
    observaciones: ''
  })
  const [files, setFiles] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoadingServices(true)
    fetchServicesCatalog()
      .then((data) => {
        if (cancelled) return
        const available = data.filter((item) => item.Activo)
        setServices(available)
        if (available.length) {
          setForm((prev) => ({ ...prev, idServicio: String(available[0].idServicio) }))
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetchServicesCatalog])

  useEffect(() => {
    if (!form.idServicio) {
      setRequirements([])
      return
    }

    let cancelled = false
    setLoadingRequirements(true)
    fetchRequirementsByService(form.idServicio)
      .then((data) => {
        if (!cancelled) setRequirements(data)
      })
      .finally(() => {
        if (!cancelled) setLoadingRequirements(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetchRequirementsByService, form.idServicio])

  const selectedService = useMemo(
    () => services.find((item) => String(item.idServicio) === String(form.idServicio)),
    [form.idServicio, services]
  )

  const canSubmit = Boolean(form.idServicio && form.observaciones.trim() && files.length)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSubmit || !usuario) {
      setError('Debes seleccionar un servicio, completar observaciones y adjuntar documentacion.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await createServiceRequest({
        idServicio: Number(form.idServicio),
        observaciones: form.observaciones.trim(),
        socioUsuario: usuario,
        socioNombre: nombre || usuario,
        files
      })

      addNotification({
        title: 'Solicitud creada',
        message: 'Tu solicitud se registro correctamente.',
        type: 'success'
      })

      navigate('/socio/solicitudes-servicio')
    } catch (submitError) {
      console.error('Error al crear solicitud', submitError)
      setError(submitError.message || 'No se pudo crear la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <BackToSocioDashboard />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitar Servicio</h1>
          <p className="mt-2 text-gray-600">Selecciona un servicio, revisa requisitos y sube la documentacion.</p>
        </div>
        <div className="rounded-full bg-cyan-100 p-3 text-cyan-700">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Servicio</label>
            <select
              value={form.idServicio}
              onChange={(event) => setForm((prev) => ({ ...prev, idServicio: event.target.value }))}
              className="input-field"
              disabled={loadingServices}
            >
              {services.map((service) => (
                <option key={service.idServicio} value={service.idServicio}>
                  {service.Nombre}
                </option>
              ))}
            </select>
          </div>

          {selectedService ? (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
              <p className="text-xs uppercase tracking-wide text-cyan-700">Servicio seleccionado</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">{selectedService.Nombre}</h2>
              <p className="mt-2 text-sm text-gray-600">{selectedService.Descripcion}</p>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={(event) => setForm((prev) => ({ ...prev, observaciones: event.target.value }))}
              className="input-field min-h-40"
              placeholder="Describe el pedido, direccion del servicio, referencias y cualquier dato util."
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">Documentacion</label>
            <FileDropzone files={files} onChange={setFiles} error={error && !files.length ? error : ''} />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="mr-2 h-5 w-5" />
              {saving ? 'Creando...' : 'Crear solicitud'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900">Requisitos</h2>
          <p className="mt-2 text-sm text-gray-500">Se actualizan segun el servicio seleccionado.</p>

          <div className="mt-5 space-y-3">
            {loadingRequirements ? (
              <p className="text-sm text-gray-500">Cargando requisitos...</p>
            ) : requirements.length ? (
              requirements.map((requirement) => (
                <div key={requirement.idRequisitoServicio} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">{requirement.Nombre}</h3>
                  <p className="mt-1 text-sm text-gray-600">{requirement.Descripcion}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No hay requisitos configurados para este servicio.
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
