import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import { cleanText, FIELD_LIMITS, firstValidationError, isPositiveNumber, validateMeaningfulText } from '@/utils/validation.js'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const CLOSED_REQUEST_STATUSES = new Set(['rechazada', 'rechazado', 'cancelada', 'cancelado'])
const INACTIVE_SERVICE_STATUSES = new Set(['inactivo', 'inactiva', 'baja', 'cancelada', 'cancelado'])

function normalizeStatus(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function requirementKey(requirement) {
  const serviceId = requirement?.idServicio ?? ''
  const name = normalizeStatus(requirement?.Nombre || requirement?.nombre || '')
  return serviceId !== '' && name ? `service:${serviceId}:name:${name}` : `id:${requirement?.idRequisitoServicio}`
}

function dedupeRequirements(requirements) {
  const map = new Map()

  ;(requirements || []).forEach((requirement) => {
    map.set(requirementKey(requirement), requirement)
  })

  return Array.from(map.values())
}

function isBlockingServiceAssignment(assignment) {
  const status = normalizeStatus(assignment?.estado ?? assignment?.Estado ?? 'Activo')
  return !INACTIVE_SERVICE_STATUSES.has(status)
}

function isBlockingServiceRequest(request) {
  const status = normalizeStatus(request?.estado ?? request?.Estado ?? 'Pendiente')
  return !CLOSED_REQUEST_STATUSES.has(status)
}

export default function SocioSolicitudServicioNueva() {
  const navigate = useNavigate()
  const usuario = useAuthStore((state) => state.usuario)
  const nombre = useAuthStore((state) => state.nombre)
  const { socioId, resolveSocioId, loadingSocio } = useCurrentSocio()
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchServicesCatalog = useServiceWorkflowStore((state) => state.fetchServicesCatalog)
  const fetchRequirementsByService = useServiceWorkflowStore((state) => state.fetchRequirementsByService)
  const fetchSocioServices = useServiceWorkflowStore((state) => state.fetchSocioServices)
  const fetchServiceRequestsBySocio = useServiceWorkflowStore((state) => state.fetchServiceRequestsBySocio)
  const createServiceRequest = useServiceWorkflowStore((state) => state.createServiceRequest)

  const [services, setServices] = useState([])
  const [blockedServiceIds, setBlockedServiceIds] = useState([])
  const [requirements, setRequirements] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingRequirements, setLoadingRequirements] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    idServicio: '',
    observaciones: ''
  })
  const [filesByRequirement, setFilesByRequirement] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoadingServices(true)

    async function loadAvailableServices() {
      try {
        const resolvedSocioId = socioId ?? (await resolveSocioId())

        if (!resolvedSocioId) {
          throw new Error('No se pudo identificar el socio actual.')
        }

        const [catalog, currentServices, currentRequests] = await Promise.all([
          fetchServicesCatalog(),
          fetchSocioServices(resolvedSocioId),
          fetchServiceRequestsBySocio(resolvedSocioId)
        ])

        if (cancelled) return

        const blockedIds = new Set([
          ...(currentRequests || [])
            .filter(isBlockingServiceRequest)
            .map((item) => String(item.idServicio))
        ])
        const available = (catalog || []).filter((item) => item.Activo && !blockedIds.has(String(item.idServicio)))

        setBlockedServiceIds(Array.from(blockedIds))
        setServices(available)
        setError('')
        setForm((prev) => {
          const previousStillAvailable = available.some((item) => String(item.idServicio) === String(prev.idServicio))
          return previousStillAvailable
            ? prev
            : { ...prev, idServicio: available.length ? String(available[0].idServicio) : '' }
        })
      } catch (loadError) {
        if (cancelled) return
        console.error('Error al cargar servicios disponibles', loadError)
        setServices([])
        setBlockedServiceIds([])
        setForm((prev) => ({ ...prev, idServicio: '' }))
        setError(loadError.message || 'No se pudieron cargar los servicios disponibles.')
      } finally {
        if (!cancelled) setLoadingServices(false)
      }
    }

    loadAvailableServices()

    return () => {
      cancelled = true
    }
  }, [fetchServiceRequestsBySocio, fetchServicesCatalog, fetchSocioServices, resolveSocioId, socioId])

  useEffect(() => {
    if (!form.idServicio) {
      setRequirements([])
      setFilesByRequirement({})
      return
    }

    let cancelled = false
    setLoadingRequirements(true)
    fetchRequirementsByService(form.idServicio)
      .then((data) => {
        if (cancelled) return
        const uniqueRequirements = dedupeRequirements(data)
        setRequirements(uniqueRequirements)
        setFilesByRequirement((prev) => {
          const next = {}
          uniqueRequirements.forEach((requirement) => {
            if (prev[requirement.idRequisitoServicio]) {
              next[requirement.idRequisitoServicio] = prev[requirement.idRequisitoServicio]
            }
          })
          return next
        })
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

  const missingFiles = requirements.filter((item) => !filesByRequirement[item.idRequisitoServicio])
  const selectedServiceBlocked = blockedServiceIds.includes(String(form.idServicio))
  const canSubmit = Boolean(form.idServicio && form.observaciones.trim() && !missingFiles.length && !selectedServiceBlocked)

  const handleFileChange = (requirementId, fileList) => {
    const file = Array.from(fileList || []).find((item) => ACCEPTED_TYPES.includes(item.type))

    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      addNotification({
        title: 'Archivo invalido',
        message: 'Cada archivo debe pesar 5 MB o menos.',
        type: 'error'
      })
      return
    }

    setFilesByRequirement((prev) => {
      const next = { ...prev }
      if (file) {
        next[requirementId] = file
      } else {
        delete next[requirementId]
      }
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const resolvedSocioId = socioId ?? (await resolveSocioId())
    const validationError = firstValidationError([
      !isPositiveNumber(form.idServicio) ? 'Selecciona un servicio valido.' : '',
      validateMeaningfulText(form.observaciones, 'Las observaciones', FIELD_LIMITS.longText),
      missingFiles.length ? 'Debes adjuntar un archivo por cada requisito.' : '',
      selectedServiceBlocked ? 'Ya tenés una solicitud pendiente para este servicio.' : ''
    ])

    if (validationError || !resolvedSocioId) {
      setError(
        validationError ||
          'No se pudo identificar el socio actual.'
      )
      return
    }

    setSaving(true)
    setError('')

    try {
      await createServiceRequest({
        idSocio: Number(resolvedSocioId),
        idServicio: Number(form.idServicio),
        observaciones: cleanText(form.observaciones),
        socioUsuario: usuario,
        socioNombre: nombre || usuario,
        filesByRequirement
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
          <h1 className="text-3xl font-bold text-gray-900">Solicitar servicio</h1>
          <p className="mt-2 text-gray-600">Selecciona un servicio, revisa requisitos y sube un archivo por requisito.</p>
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
              disabled={loadingServices || !services.length}
            >
              {!services.length ? (
                <option value="">
                  {loadingServices ? 'Cargando servicios...' : 'No hay servicios disponibles para solicitar'}
                </option>
              ) : null}
              {services.map((service) => (
                <option key={service.idServicio} value={service.idServicio}>
                  {service.Nombre}
                </option>
              ))}
            </select>
            {!loadingServices && !services.length ? (
              <p className="mt-2 text-sm text-gray-500">
                Ya tenés solicitudes pendientes para los servicios disponibles.
              </p>
            ) : null}
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
              minLength={FIELD_LIMITS.longText.min}
              maxLength={FIELD_LIMITS.longText.max}
              className="input-field min-h-40"
              placeholder="Describe el pedido, direccion del servicio, referencias y cualquier dato util."
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">Documentacion por requisito</label>
            <div className="space-y-4">
              {requirements.map((requirement) => {
                const currentFile = filesByRequirement[requirement.idRequisitoServicio]

                return (
                  <div key={requirement.idRequisitoServicio} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">{requirement.Nombre}</h3>
                    <p className="mt-1 text-sm text-gray-600">{requirement.Descripcion}</p>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="mt-3 block w-full text-sm text-gray-700"
                      onChange={(event) => handleFileChange(requirement.idRequisitoServicio, event.target.files)}
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      {currentFile ? `Archivo seleccionado: ${currentFile.name}` : 'Aun no hay archivo seleccionado.'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {loadingSocio ? <p className="text-sm text-gray-500">Identificando socio actual...</p> : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loadingSocio || !canSubmit}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="mr-2 h-5 w-5" />
              {saving ? 'Creando...' : 'Crear solicitud'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900">Requisitos</h2>
          <p className="mt-2 text-sm text-gray-500">Cada requisito debe subirse por separado.</p>

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
