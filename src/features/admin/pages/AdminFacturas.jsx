import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Filter, PlusCircle, Receipt, Save, Search, X } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import useAppStore from '@/store/appStore.js'
import useCooperativeStore from '@/store/cooperativeStore.js'
import useServiceWorkflowStore from '@/store/serviceWorkflowStore.js'
import { useSocios } from '@/hooks/useSocios.js'
import { formatDate } from '@/utils/formatDate.js'
import { limpiarTextoPlano } from '@/utils/turnosUtils.jsx'
import { FIELD_LIMITS, firstValidationError, isPositiveNumber, validateMeaningfulText } from '@/utils/validation.js'

const initialForm = {
  idSocio: '',
  idServicio: '',
  amount: '',
  dueDate: '',
  paymentLink: '',
  observations: ''
}

const PAGE_SIZE = 6

function statusStyles(status) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700'
    case 'overdue':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'paid':
      return 'Pagado'
    case 'overdue':
      return 'Vencido'
    default:
      return 'Pendiente'
  }
}

function buildManagementDraft(factura) {
  return {
    status: factura.status,
    amount: String(factura.amount ?? ''),
    dueDate: factura.dueDate ? String(factura.dueDate).slice(0, 10) : '',
    paymentLink: factura.paymentLink || '',
    observations: factura.observations || ''
  }
}

function isValidPaymentLink(value) {
  if (!value) return true
  if (String(value).length < FIELD_LIMITS.url.min || String(value).length > FIELD_LIMITS.url.max) return false

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function isPastDate(dateValue) {
  if (!dateValue) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = new Date(`${dateValue}T00:00:00`)
  return Number.isNaN(selected.getTime()) || selected < today
}

function validateBillDraft(draft, { allowPastDueDate = false } = {}) {
  const amount = Number(draft.amount)

  return firstValidationError([
    !Number.isFinite(amount) || amount <= 0 ? 'El monto debe ser mayor a cero.' : '',
    !draft.dueDate ? 'La fecha de vencimiento es obligatoria.' : '',
    !allowPastDueDate && isPastDate(draft.dueDate) ? 'La fecha de vencimiento no puede ser anterior a hoy.' : '',
    !isValidPaymentLink(draft.paymentLink) ? 'El link de pago debe ser una URL http o https valida.' : '',
    draft.observations && validateMeaningfulText(draft.observations, 'Las observaciones', FIELD_LIMITS.observation)
  ])
}

export default function AdminFacturas() {
  const addNotification = useAppStore((state) => state.addNotification)
  const idEmpleado = useAuthStore((state) => state.idEmpleado)
  const { fetchSocios } = useSocios(false)
  const fetchSocioServices = useServiceWorkflowStore((state) => state.fetchSocioServices)
  const fetchBills = useCooperativeStore((state) => state.fetchBills)
  const createBill = useCooperativeStore((state) => state.createBill)
  const updateBill = useCooperativeStore((state) => state.updateBill)
  const payBill = useCooperativeStore((state) => state.payBill)

  const [socios, setSocios] = useState([])
  const [services, setServices] = useState([])
  const [facturas, setFacturas] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filtro, setFiltro] = useState('Todas')
  const [selectedBill, setSelectedBill] = useState(null)
  const [managementForm, setManagementForm] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setForm(initialForm)
    setServices([])
  }

  const closeBillManager = () => {
    setSelectedBill(null)
    setManagementForm(null)
  }

  const loadBills = async () => {
    const data = await fetchBills()
    setFacturas(data)
    return data
  }

  useEffect(() => {
    fetchSocios().then(setSocios)
    loadBills()
  }, [fetchSocios, fetchBills])

  useEffect(() => {
    if (!form.idSocio) {
      setServices([])
      return
    }

    fetchSocioServices(form.idSocio).then((data) => {
      setServices(data)
      setForm((prev) => ({
        ...prev,
        idServicio: data[0]?.idServicio != null ? String(data[0].idServicio) : ''
      }))
    })
  }, [fetchSocioServices, form.idSocio])

  const selectedSocio = useMemo(
    () => socios.find((socio) => String(socio.idSocio) === String(form.idSocio)) ?? null,
    [form.idSocio, socios]
  )

  const selectedService = useMemo(
    () => services.find((service) => String(service.idServicio) === String(form.idServicio)) ?? null,
    [form.idServicio, services]
  )
  const selectedBillSocio = useMemo(
    () => socios.find((socio) => String(socio.idSocio) === String(selectedBill?.idSocio)) ?? null,
    [selectedBill?.idSocio, socios]
  )

  const summary = useMemo(
    () => ({
      pending: facturas.filter((factura) => factura.status === 'pending').length,
      overdue: facturas.filter((factura) => factura.status === 'overdue').length,
      paid: facturas.filter((factura) => factura.status === 'paid').length
    }),
    [facturas]
  )

  const searchedBills = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return facturas

    return facturas.filter((factura) =>
      [factura.socioNombre, factura.socioUsuario, factura.service, factura.period, factura.id]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [facturas, search])

  const filtered = useMemo(
    () =>
      filtro === 'Todas'
        ? searchedBills
        : filtro === 'Pagadas'
          ? searchedBills.filter((factura) => factura.status === 'paid')
          : filtro === 'Vencidas'
            ? searchedBills.filter((factura) => factura.status === 'overdue')
            : searchedBills.filter((factura) => factura.status === 'pending'),
    [filtro, searchedBills]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [currentPage, filtered])

  useEffect(() => {
    setPage(1)
  }, [filtro])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const selectionError = firstValidationError([
      !selectedSocio || !isPositiveNumber(selectedSocio.idSocio) ? 'Selecciona un socio valido.' : '',
      !selectedService || !isPositiveNumber(selectedService.idServicio) ? 'Selecciona un servicio aprobado valido.' : ''
    ])

    if (selectionError) {
      addNotification({
        title: 'Faltan datos',
        message: selectionError,
        type: 'error'
      })
      return
    }

    const validationError = validateBillDraft(form)
    if (validationError) {
      addNotification({
        title: 'Datos invalidos',
        message: validationError,
        type: 'error'
      })
      return
    }

    try {
      await createBill({
        idSocio: selectedSocio.idSocio,
        idEmpleado: isPositiveNumber(idEmpleado) ? Number(idEmpleado) : 0,
        idServicio: selectedService.idServicio,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        paymentLink: form.paymentLink.trim(),
        observations: limpiarTextoPlano(form.observations)
      })

      setForm(initialForm)
      setServices([])
      setShowCreateModal(false)
      await loadBills()
      addNotification({
        title: 'Factura creada',
        message: 'La factura se registro correctamente.',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo crear la factura.',
        type: 'error'
      })
    }
  }

  const openBillManager = (factura) => {
    setSelectedBill(factura)
    setManagementForm(buildManagementDraft(factura))
  }

  const handleSaveBill = async () => {
    if (!selectedBill || !managementForm) return

    const validationError = validateBillDraft(managementForm, {
      allowPastDueDate: managementForm.status === 'overdue'
    })

    if (validationError) {
      addNotification({
        title: 'Datos invalidos',
        message: validationError,
        type: 'error'
      })
      return
    }

    try {
      await updateBill({
        id: selectedBill.id,
        idServicio: selectedBill.idServicio,
        amount: Number(managementForm.amount),
        dueDate: managementForm.dueDate,
        paymentLink: managementForm.paymentLink.trim(),
        observations: limpiarTextoPlano(managementForm.observations)
      })

      if (selectedBill.status !== 'paid' && managementForm.status === 'paid') {
        await payBill(selectedBill.id)
      }

      const refreshed = await loadBills()
      const updatedBill = refreshed.find((item) => item.id === selectedBill.id) || null
      setSelectedBill(updatedBill)
      setManagementForm(updatedBill ? buildManagementDraft(updatedBill) : null)

      addNotification({
        title: 'Factura actualizada',
        message: `La factura ${selectedBill.id} fue actualizada correctamente.`,
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message || 'No se pudo actualizar la factura.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de facturas</h1>
          <p className="mt-2 text-gray-600">Consulta, filtra y actualiza el estado de las facturas emitidas.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva factura
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Vencidas</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{summary.overdue}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pagadas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.paid}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="card">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Listado de facturas</h2>
                <p className="text-sm text-gray-500">Busca una factura y usa "Gestionar" para cambiar estado, monto o vencimiento.</p>
              </div>
              <p className="text-sm text-gray-500">
                {filtered.length} factura{filtered.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por socio, documento, servicio o numero..."
                  className="w-full text-sm outline-none"
                />
              </label>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select value={filtro} onChange={(event) => setFiltro(event.target.value)} className="rounded border px-3 py-2 text-sm">
                  <option>Todas</option>
                  <option>Pendientes</option>
                  <option>Vencidas</option>
                  <option>Pagadas</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {paginatedBills.map((factura) => (
                <div key={factura.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{factura.socioNombre}</p>
                      <p className="text-sm text-gray-600">{factura.service}</p>
                      <p className="text-xs text-gray-500">Vence: {formatDate(factura.dueDate, 'es-AR')}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(factura.status)}`}>
                      {statusLabel(factura.status)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">${Number(factura.amount).toLocaleString('es-AR')}</p>
                    <div className="flex gap-2">
                      {false && factura.paymentLink ? (
                        <a
                          href={factura.paymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Link
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openBillManager(factura)}
                        className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Socio</th>
                    <th className="px-4 py-3">Servicio</th>
                    <th className="px-4 py-3">Vence</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBills.map((factura) => (
                    <tr key={factura.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{factura.socioNombre}</td>
                      <td className="px-4 py-3">{factura.service}</td>
                      <td className="px-4 py-3">{formatDate(factura.dueDate, 'es-AR')}</td>
                      <td className="px-4 py-3">${Number(factura.amount).toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(factura.status)}`}>
                          {statusLabel(factura.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {false && factura.paymentLink ? (
                            <a
                              href={factura.paymentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <ExternalLink className="mr-1 h-4 w-4" />
                              Link
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openBillManager(factura)}
                            className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                          >
                            Gestionar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length ? (
                <p className="py-8 text-center text-gray-500">
                  {search ? 'No hay facturas que coincidan con la busqueda.' : 'No hay facturas cargadas.'}
                </p>
              ) : null}
            </div>
            {filtered.length ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-500">
                  Pagina {currentPage} de {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-3 md:flex md:items-center md:justify-center md:p-4"
          onClick={closeCreateModal}
        >
          <div
            className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:h-auto md:max-h-[88vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 md:px-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Nueva factura</h2>
                <p className="mt-1 text-sm text-gray-600">Selecciona el socio, el servicio aprobado y completa los datos de cobro.</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 md:px-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destinatario</p>
                  <select
                    value={form.idSocio}
                    onChange={(event) => setForm((prev) => ({ ...prev, idSocio: event.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Seleccionar socio...</option>
                    {socios.map((socio) => (
                      <option key={socio.idSocio} value={socio.idSocio}>
                        {socio.Persona?.Apellido}, {socio.Persona?.Nombre} - {socio.Persona?.Documento}
                      </option>
                    ))}
                  </select>

                  <select
                    value={form.idServicio}
                    onChange={(event) => setForm((prev) => ({ ...prev, idServicio: event.target.value }))}
                    className="input-field"
                    required
                    disabled={!services.length}
                  >
                    <option value="">Seleccionar servicio aprobado...</option>
                    {services.map((service) => (
                      <option key={`${service.idServicioSocio ?? service.idServicio}-${service.idServicio}`} value={service.idServicio}>
                        {service.servicioNombre}
                      </option>
                    ))}
                  </select>

                  {selectedSocio && !services.length ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Este socio todavia no tiene servicios aprobados para facturar.
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Datos de facturacion</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                      className="input-field"
                      placeholder="Monto total"
                      required
                    />
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>

                  <input
                    type="url"
                    value={form.paymentLink}
                    onChange={(event) => setForm((prev) => ({ ...prev, paymentLink: event.target.value }))}
                    minLength={FIELD_LIMITS.url.min}
                    maxLength={FIELD_LIMITS.url.max}
                    className="input-field"
                    placeholder="Link de pago"
                  />

                  <textarea
                    value={form.observations}
                    onChange={(event) => setForm((prev) => ({ ...prev, observations: event.target.value }))}
                    minLength={FIELD_LIMITS.observation.min}
                    maxLength={FIELD_LIMITS.observation.max}
                    className="input-field min-h-28"
                    placeholder="Observaciones"
                  />
                </div>

                {!idEmpleado ? (
                  <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    La factura se emitira con autorizacion de administrador.
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-4 md:px-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!services.length}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Crear factura
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedBill && managementForm ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-3 md:flex md:items-center md:justify-center md:p-4"
          onClick={closeBillManager}
        >
          <div
            className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:h-auto md:max-h-[88vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 md:px-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Gestion de factura</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Factura #{selectedBill.id} · {selectedBill.socioNombre} · {selectedBill.service}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBillManager}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-blue-50 p-4 md:col-span-2">
                <p className="text-xs uppercase text-blue-700">Datos del socio</p>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-semibold text-gray-900">{selectedBillSocio?.Persona?.Nombre || selectedBill?.socioNombre || 'No informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Apellido</p>
                    <p className="font-semibold text-gray-900">{selectedBillSocio?.Persona?.Apellido || ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Documento</p>
                    <p className="font-semibold text-gray-900">{selectedBillSocio?.Persona?.Documento || selectedBill?.socioUsuario || 'No informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefono</p>
                    <p className="font-semibold text-gray-900">{selectedBillSocio?.Persona?.Telefono || 'No informado'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Correo</p>
                    <p className="font-semibold text-gray-900">{selectedBillSocio?.Persona?.Email || 'No informado'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Estado</p>
                <select
                  value={managementForm.status}
                  onChange={(event) => setManagementForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="input-field mt-2"
                  disabled={selectedBill.status === 'paid'}
                >
                  <option value={selectedBill.status === 'overdue' ? 'overdue' : 'pending'}>
                    {selectedBill.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                  </option>
                  <option value="paid">Pagado</option>
                </select>
                {selectedBill.status === 'paid' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Un pago confirmado no puede volver a pendiente.
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Monto</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={managementForm.amount}
                  onChange={(event) => setManagementForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="input-field mt-2"
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Vencimiento</p>
                <input
                  type="date"
                  value={managementForm.dueDate}
                  onChange={(event) => setManagementForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="input-field mt-2"
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Link de pago</p>
                <input
                  type="url"
                  value={managementForm.paymentLink}
                  onChange={(event) => setManagementForm((prev) => ({ ...prev, paymentLink: event.target.value }))}
                  minLength={FIELD_LIMITS.url.min}
                  maxLength={FIELD_LIMITS.url.max}
                  className="input-field mt-2"
                />
              </div>
            </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Observaciones</p>
              <textarea
                value={managementForm.observations}
                onChange={(event) => setManagementForm((prev) => ({ ...prev, observations: event.target.value }))}
                minLength={FIELD_LIMITS.observation.min}
                maxLength={FIELD_LIMITS.observation.max}
                className="input-field mt-2 min-h-28"
              />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-4 md:px-6">
              <button
                type="button"
                onClick={closeBillManager}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBill}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
