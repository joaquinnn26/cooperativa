import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import BackToSocioDashboard from '@/components/BackToSocioDashboard.jsx'
import { useReclamos } from '@/hooks/useReclamos.js'
import { useCurrentSocio } from '@/hooks/useCurrentSocio.js'
import useAppStore from '@/store/appStore.js'
import { cleanText, FIELD_LIMITS, firstValidationError, isPositiveNumber, validateMeaningfulText } from '@/utils/validation.js'

export default function ReclamoNuevo() {
  const { crearReclamo, tiposReclamo, fetchTiposReclamo } = useReclamos()
  const { socioId, loadingSocio, resolveSocioId } = useCurrentSocio()
  const addNotification = useAppStore((state) => state.addNotification)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    idTipoReclamo: '',
    descripcion: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTiposReclamo().catch((error) => {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudieron cargar los tipos de reclamo',
        type: 'error'
      })
    })
  }, [addNotification, fetchTiposReclamo])

  useEffect(() => {
    if (tiposReclamo.length && !form.idTipoReclamo) {
      setForm((prev) => ({
        ...prev,
        idTipoReclamo: String(tiposReclamo[0].idTipoReclamo)
      }))
    }
  }, [form.idTipoReclamo, tiposReclamo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = firstValidationError([
      !isPositiveNumber(form.idTipoReclamo) ? 'Selecciona un tipo de reclamo valido.' : '',
      validateMeaningfulText(form.descripcion, 'La descripcion', FIELD_LIMITS.longText)
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    setIsLoading(true)

    try {
      const resolvedSocioId = socioId ?? (await resolveSocioId())

      if (!resolvedSocioId) {
        throw new Error('No se pudo identificar el socio logueado')
      }

      await crearReclamo({
        idSocio: resolvedSocioId,
        idTipoReclamo: Number(form.idTipoReclamo),
        idEstadoReclamo: 1,
        Descripcion: cleanText(form.descripcion)
      })

      addNotification({
        title: 'Reclamo enviado',
        message: 'Gracias por avisarnos',
        type: 'success'
      })
      navigate('/socio/reclamos')
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo registrar el reclamo',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackToSocioDashboard />
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Reclamo</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de reclamo</label>
            <select
              name="idTipoReclamo"
              value={form.idTipoReclamo}
              onChange={handleChange}
              className="input-field"
              required
              disabled={!tiposReclamo.length || isLoading}
            >
              {!tiposReclamo.length ? <option value="">Cargando tipos...</option> : null}
              {tiposReclamo.map((tipo) => (
                <option key={tipo.idTipoReclamo} value={tipo.idTipoReclamo}>
                  {tipo.NombreReclamo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={4}
              required
              minLength={FIELD_LIMITS.longText.min}
              maxLength={FIELD_LIMITS.longText.max}
              className="input-field"
              placeholder="Describe el problema con el mayor detalle posible"
            />
          </div>

          {loadingSocio ? (
            <p className="text-sm text-gray-500">Identificando socio actual...</p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || loadingSocio || !socioId || !form.idTipoReclamo}
            className="inline-flex items-center btn-primary px-6 py-3 disabled:opacity-50"
          >
            <Send className="w-5 h-5 mr-2" />
            {isLoading ? 'Enviando...' : 'Enviar reclamo'}
          </button>
        </form>
      </div>
    </div>
  )
}
