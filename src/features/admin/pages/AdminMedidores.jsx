import React, { useEffect, useMemo, useState } from 'react'
import { Gauge, Pencil, Power, Search, Trash2, X } from 'lucide-react'
import useAppStore from '@/store/appStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { confirmAction } from '@/utils/alerts.js'
import { formatDate } from '@/utils/formatDate.js'
import { cleanText, firstValidationError, isPositiveNumber, validateRequired } from '@/utils/validation.js'

function normalizeServiceName(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function serviceRequiresMeter(nombre) {
  const normalized = normalizeServiceName(nombre)
  return normalized === 'luz' || normalized === 'agua potable'
}

function inferredMeterTypeId(serviceName) {
  return normalizeServiceName(serviceName) === 'agua potable' ? 2 : 1
}

function inferredMeterTypeLabel(serviceName) {
  return normalizeServiceName(serviceName) === 'agua potable' ? 'Agua' : 'Electrico'
}

function statusStyles(status) {
  return status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
}

const initialEditingForm = {
  TipoMedidor: '',
  Estado: 'Activo'
}

export default function AdminMedidores() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchMeters = useServiceWorkflowStore((state) => state.fetchMeters)
  const fetchAllServiceAssignments = useServiceWorkflowStore((state) => state.fetchAllServiceAssignments)
  const fetchServiceRequests = useServiceWorkflowStore((state) => state.fetchServiceRequests)
  const createMeter = useServiceWorkflowStore((state) => state.createMeter)
  const updateMeter = useServiceWorkflowStore((state) => state.updateMeter)
  const toggleMeterStatus = useServiceWorkflowStore((state) => state.toggleMeterStatus)
  const deleteMeter = useServiceWorkflowStore((state) => state.deleteMeter)

  const [meters, setMeters] = useState([])
  const [serviceAssignments, setServiceAssignments] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedInstallationId, setSelectedInstallationId] = useState('')
  const [search, setSearch] = useState('')
  const [editingMeter, setEditingMeter] = useState(null)
  const [editingForm, setEditingForm] = useState(initialEditingForm)

  const loadData = async () => {
    const [metersData, assignmentsData, requestsData] = await Promise.all([
      fetchMeters(),
      fetchAllServiceAssignments(),
      fetchServiceRequests()
    ])
    setMeters(metersData || [])
    setServiceAssignments(assignmentsData || [])
    setRequests(requestsData || [])
  }

  useEffect(() => {
    loadData()
  }, [fetchAllServiceAssignments, fetchMeters, fetchServiceRequests])

  const installationCandidates = useMemo(() => {
    const approvedRequests = requests.filter(
      (request) =>
        serviceRequiresMeter(request.servicioNombre) &&
        normalizeServiceName(request.estado) === 'aprobada'
    )

    return approvedRequests
      .map((request) => {
        const assignment = serviceAssignments.find(
          (item) =>
            String(item.idSocio) === String(request.idSocio) &&
            String(item.idServicio) === String(request.idServicio) &&
            item.estado === 'Activo'
        )

        if (!assignment) return null

        const alreadyHasMeter = meters.some((meter) => {
          const sameAssignment =
            meter.idServicioSocio != null &&
            String(meter.idServicioSocio) === String(assignment.idServicioSocio) &&
            meter.Estado !== 'Inactivo'

          const sameSocioAndService =
            String(meter.socioUsuario || '') === String(request.socioUsuario || assignment.socioUsuario || '') &&
            normalizeServiceName(meter.servicioNombre) === normalizeServiceName(request.servicioNombre || assignment.servicioNombre) &&
            meter.Estado !== 'Inactivo'

          return sameAssignment || sameSocioAndService
        })

        if (alreadyHasMeter) return null

        return {
          requestId: request.idSolicitudServicio,
          idServicioSocio: assignment.idServicioSocio,
          idSocio: request.idSocio,
          idServicio: request.idServicio,
          socioNombre: request.socioNombre || assignment.socioNombre,
          socioUsuario: request.socioUsuario || assignment.socioUsuario,
          servicioNombre: request.servicioNombre || assignment.servicioNombre,
          fechaSolicitud: request.fechaSolicitud,
          direccion: request.direccion || 'Sin direccion informada',
          tipoSugerido: inferredMeterTypeLabel(request.servicioNombre)
        }
      })
      .filter(Boolean)
  }, [meters, requests, serviceAssignments])

  const filteredMeters = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return meters

    return meters.filter((meter) =>
      [meter.NumeroMedidor, meter.socioNombre, meter.socioUsuario, meter.servicioNombre, meter.TipoMedidor]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [meters, search])

  const selectedInstallation = useMemo(
    () => installationCandidates.find((item) => String(item.idServicioSocio) === String(selectedInstallationId)) ?? null,
    [installationCandidates, selectedInstallationId]
  )

  const handleInstall = async () => {
    if (!selectedInstallation || !isPositiveNumber(selectedInstallation.idServicioSocio)) {
      addNotification({
        title: 'Datos invalidos',
        message: 'Selecciona una instalacion valida antes de crear el medidor.',
        type: 'error'
      })
      return
    }

    try {
      await createMeter({
        idServicioSocio: Number(selectedInstallation.idServicioSocio),
        idTipoMedidor: inferredMeterTypeId(selectedInstallation.servicioNombre)
      })

      addNotification({
        title: 'Medidor instalado',
        message: 'El numero del medidor fue generado automaticamente y la instalacion se registro correctamente.',
        type: 'success'
      })

      setSelectedInstallationId('')
      await loadData()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo guardar el medidor.',
        type: 'error'
      })
    }
  }

  const openEditModal = (meter) => {
    setEditingMeter(meter)
    setEditingForm({
      TipoMedidor: meter.TipoMedidor || '',
      Estado: meter.Estado || 'Activo'
    })
  }

  const closeEditModal = () => {
    setEditingMeter(null)
    setEditingForm(initialEditingForm)
  }

  const handleSaveMeter = async () => {
    if (!editingMeter) return

    const validationError = firstValidationError([
      validateRequired(editingForm.TipoMedidor, 'El tipo de medidor'),
      !['Activo', 'Inactivo'].includes(editingForm.Estado) ? 'Selecciona un estado valido.' : ''
    ])

    if (validationError) {
      addNotification({ title: 'Datos invalidos', message: validationError, type: 'error' })
      return
    }

    try {
      await updateMeter(editingMeter.idMedidor, {
        TipoMedidor: cleanText(editingForm.TipoMedidor),
        Estado: editingForm.Estado
      })

      if (editingForm.Estado !== editingMeter.Estado) {
        await toggleMeterStatus(editingMeter.idMedidor)
      }

      addNotification({
        title: 'Medidor actualizado',
        message: 'Se guardaron los cambios del medidor.',
        type: 'success'
      })

      closeEditModal()
      await loadData()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo actualizar el medidor.',
        type: 'error'
      })
    }
  }

  const handleDeleteMeter = async (meter) => {
    const confirmed = await confirmAction({
      title: 'Eliminar medidor',
      message: `Vas a eliminar el medidor ${meter.NumeroMedidor}. Esta accion puede ser irreversible.`,
      confirmButtonText: 'Eliminar',
      type: 'warning',
      danger: true
    })
    if (!confirmed) return

    try {
      await deleteMeter(meter.idMedidor)
      addNotification({
        title: 'Medidor eliminado',
        message: `El medidor ${meter.NumeroMedidor} fue eliminado.`,
        type: 'success'
      })
      await loadData()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo eliminar el medidor.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion de medidores</h1>
        <p className="mt-2 text-gray-600">Primero instala medidores sobre solicitudes aprobadas de luz y agua. Despues gestiona los medidores ya instalados.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Instalaciones pendientes</h2>
            <p className="mt-2 text-sm text-gray-500">Solo aparecen solicitudes aprobadas de Luz y Agua Potable. El numero del medidor se genera automaticamente.</p>
          </div>

          <div className="space-y-3">
            {installationCandidates.map((candidate) => (
              <button
                key={`${candidate.requestId}-${candidate.idServicioSocio}`}
                type="button"
                onClick={() => setSelectedInstallationId(String(candidate.idServicioSocio))}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  String(selectedInstallationId) === String(candidate.idServicioSocio)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.socioNombre}</p>
                    <p className="text-sm text-gray-600">Doc. {candidate.socioUsuario || 'Sin documento'}</p>
                    <p className="mt-2 text-sm text-gray-700">Servicio a instalar: {candidate.servicioNombre}</p>
                    <p className="text-sm text-gray-500">Direccion: {candidate.direccion}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {candidate.tipoSugerido}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500">Solicitud del {formatDate(candidate.fechaSolicitud, 'es-AR')}</p>
              </button>
            ))}

            {!installationCandidates.length ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                No hay solicitudes aprobadas de Luz o Agua Potable pendientes de instalacion.
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Seleccion actual</p>
            {selectedInstallation ? (
              <>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedInstallation.socioNombre} - {selectedInstallation.servicioNombre}
                </p>
                <p className="text-sm text-gray-600">Tipo sugerido: {selectedInstallation.tipoSugerido}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">Todavia no seleccionaste una solicitud.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleInstall}
            disabled={!selectedInstallation}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Gauge className="mr-2 h-4 w-4" />
            Instalar medidor
          </button>
        </div>

        <div className="card space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medidores instalados</h2>
              <p className="mt-2 text-sm text-gray-500">Aqui puedes modificar, suspender o eliminar medidores ya registrados.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar socio, numero o servicio..."
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredMeters.map((meter) => (
              <div key={meter.idMedidor} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{meter.NumeroMedidor}</p>
                    <p className="text-sm text-gray-600">{meter.socioNombre || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500">{meter.socioUsuario || 'Sin documento'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(meter.Estado)}`}>
                    {meter.Estado}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Servicio</p>
                    <p className="font-medium text-gray-900">{meter.servicioNombre}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Tipo</p>
                    <p className="font-medium text-gray-900">{meter.TipoMedidor}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Instalacion</p>
                    <p className="font-medium text-gray-900">{formatDate(meter.FechaInstalacion, 'es-AR')}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(meter)}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Modificar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleMeterStatus(meter.idMedidor)
                      await loadData()
                    }}
                    className="inline-flex items-center rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Power className="mr-1 h-4 w-4" />
                    {meter.Estado === 'Activo' ? 'Suspender' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMeter(meter)}
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Numero</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Instalacion</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeters.map((meter) => (
                  <tr key={meter.idMedidor} className="border-t border-gray-100">
                    <td className="px-4 py-4 font-semibold text-gray-900">{meter.NumeroMedidor}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{meter.socioNombre || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{meter.socioUsuario || 'Sin documento'}</p>
                    </td>
                    <td className="px-4 py-4">{meter.servicioNombre}</td>
                    <td className="px-4 py-4">{meter.TipoMedidor}</td>
                    <td className="px-4 py-4">{formatDate(meter.FechaInstalacion, 'es-AR')}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(meter.Estado)}`}>
                        {meter.Estado}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(meter)}
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Modificar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleMeterStatus(meter.idMedidor)
                            await loadData()
                          }}
                          className="inline-flex items-center rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          <Power className="mr-1 h-4 w-4" />
                          {meter.Estado === 'Activo' ? 'Suspender' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeter(meter)}
                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredMeters.length ? (
              <div className="py-12 text-center text-gray-500">
                {search ? 'No hay medidores que coincidan con la busqueda.' : 'Todavia no hay medidores instalados.'}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {editingMeter ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Modificar medidor</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {editingMeter.NumeroMedidor} - {editingMeter.socioNombre} - {editingMeter.servicioNombre}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de medidor</label>
                <input
                  value={editingForm.TipoMedidor}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, TipoMedidor: event.target.value }))}
                  className="input-field"
                  placeholder="Tipo de medidor"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={editingForm.Estado}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, Estado: event.target.value }))}
                  className="input-field"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleSaveMeter}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
