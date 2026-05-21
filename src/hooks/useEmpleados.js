import { useCallback, useEffect, useMemo, useState } from 'react'

import { apiUrl } from '@/config/api.js'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    ...options
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `HTTP ${res.status}`)
  }

  return res.status === 204 ? null : res.json()
}

async function jsonFetchFirst(paths) {
  let lastError = null

  for (const path of paths) {
    try {
      return await jsonFetch(apiUrl(path))
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('No se pudo obtener el recurso solicitado')
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function ensureArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

function extractDisplayName(entity, ignoredKeys = []) {
  if (!entity || typeof entity !== 'object') return null

  const ignored = new Set(
    ignoredKeys.map((key) => String(key).toLowerCase())
  )

  for (const [key, value] of Object.entries(entity)) {
    if (ignored.has(String(key).toLowerCase())) continue
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return null
}

function normalizePersona(persona) {
  if (!persona) return null

  return {
    idPersona: pickFirst(
      persona.idPersona,
      persona.IdPersona,
      persona.idPersonaNavigation,
      persona.id,
      persona.IDPersona,
      persona.PersonaId,
      persona.personaId
    ),
    Nombre: pickFirst(persona.Nombre, persona.nombre, ''),
    Apellido: pickFirst(persona.Apellido, persona.apellido, ''),
    Documento: pickFirst(persona.Documento, persona.documento, ''),
    Telefono: pickFirst(persona.Telefono, persona.telefono, ''),
    Email: pickFirst(persona.Email, persona.email, ''),
    Calle: pickFirst(persona.Calle, persona.calle, ''),
    Numero: pickFirst(persona.Numero, persona.numero, '')
  }
}

function normalizeCargo(cargo) {
  return {
    idCargo: pickFirst(cargo?.idCargo, cargo?.IdCargo, cargo?.id, cargo?.IDCargo, cargo?.codigo),
    Nombre: pickFirst(
      cargo?.Nombre,
      cargo?.nombre,
      cargo?.NombreCargo,
      cargo?.nombreCargo,
      cargo?.TipoCargo,
      cargo?.tipoCargo,
      cargo?.Puesto,
      cargo?.puesto,
      cargo?.CargoNombre,
      cargo?.cargoNombre,
      cargo?.Titulo,
      cargo?.titulo,
      cargo?.Descripcion,
      cargo?.descripcion,
      cargo?.Cargo,
      cargo?.cargo,
      cargo?.Denominacion,
      cargo?.denominacion,
      extractDisplayName(cargo, ['idCargo', 'IdCargo', 'id', 'IDCargo', 'codigo']),
      'Sin cargo'
    )
  }
}

function normalizeEmpleado(empleado) {
  const persona = normalizePersona(empleado.Persona || empleado.persona || empleado)
  const cargo = normalizeCargo(empleado.Cargo || empleado.cargo || empleado)

  return {
    ...empleado,
    idEmpleado: pickFirst(empleado.idEmpleado, empleado.IdEmpleado, empleado.id),
    idPersona: pickFirst(empleado.idPersona, empleado.IdPersona, persona?.idPersona),
    idCargo: pickFirst(empleado.idCargo, empleado.IdCargo, cargo.idCargo),
    Activo: Boolean(pickFirst(empleado.Activo, empleado.activo, empleado.EstadoActivo, true)),
    Persona: {
      ...persona,
      Nombre: pickFirst(empleado.Nombre, empleado.nombre, persona?.Nombre, ''),
      Apellido: pickFirst(empleado.Apellido, empleado.apellido, persona?.Apellido, ''),
      Documento: pickFirst(empleado.Documento, empleado.documento, persona?.Documento, ''),
      Telefono: pickFirst(empleado.Telefono, empleado.telefono, persona?.Telefono, ''),
      Email: pickFirst(empleado.Email, empleado.email, persona?.Email, '')
    },
    Cargo: {
      ...cargo,
      Nombre: pickFirst(
        typeof empleado.Cargo === 'string' ? empleado.Cargo : null,
        typeof empleado.cargo === 'string' ? empleado.cargo : null,
        cargo.Nombre
      )
    },
    FechaDelInicio: pickFirst(empleado.FechaDelInicio, empleado.fechaDelInicio, empleado.FechaDeInicio, empleado.fechaDeInicio)
  }
}

export function useEmpleados(autoLoad = true) {
  const [empleados, setEmpleados] = useState([])
  const [cargos, setCargos] = useState([])
  const [personas, setPersonas] = useState([])
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [catalogosError, setCatalogosError] = useState('')

  const fetchEmpleados = useCallback(async () => {
    setLoading(true)
    try {
      const data = await jsonFetch(apiUrl('/empleado'))
      const normalized = ensureArray(data).map(normalizeEmpleado)
      setEmpleados(normalized)
      return normalized
    } catch (error) {
      console.error('Error al obtener empleados', error)
      setEmpleados([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCatalogos = useCallback(async () => {
    setLoadingCatalogos(true)
    setCatalogosError('')

    try {
      const [cargosData, personasData, sociosData] = await Promise.all([
        jsonFetchFirst(['/cargo', '/cargos', '/empleado/cargo', '/empleado/cargos']).catch(() => []),
        jsonFetchFirst(['/persona', '/persona/listado']).catch(() => []),
        jsonFetchFirst(['/socio', '/socios']).catch(() => [])
      ])

      const normalizedCargos = ensureArray(cargosData).map(normalizeCargo).filter((cargo) => cargo.idCargo != null)
      const normalizedPersonas = ensureArray(personasData).map(normalizePersona).filter(Boolean)
      const normalizedSocios = ensureArray(sociosData)

      setCargos(normalizedCargos)
      setPersonas(normalizedPersonas)
      setSocios(normalizedSocios)

      if (!normalizedCargos.length) {
        setCatalogosError('No se pudieron cargar los cargos disponibles.')
      }
    } catch (error) {
      console.error('Error al obtener catalogos de empleados', error)
      setCargos([])
      setPersonas([])
      setSocios([])
      setCatalogosError('No se pudieron cargar los catalogos de empleados.')
    } finally {
      setLoadingCatalogos(false)
    }
  }, [])

  const personasRegistradas = useMemo(() => {
    const map = new Map()

    personas.forEach((persona) => {
      const key = persona.idPersona ?? persona.Documento
      if (key !== undefined && key !== null) {
        map.set(String(key), persona)
      }
    })

    socios.forEach((socio) => {
      const persona = normalizePersona(socio.Persona || socio.persona)
      if (!persona) return
      if (persona.idPersona == null) return
      const key = persona.idPersona ?? persona.Documento
      if (key !== undefined && key !== null) {
        map.set(String(key), persona)
      }
    })

    return Array.from(map.values()).sort((a, b) =>
      `${a.Apellido} ${a.Nombre}`.localeCompare(`${b.Apellido} ${b.Nombre}`, 'es')
    )
  }, [personas, socios])

  const sociosDisponibles = useMemo(() => {
    const empleadosPorPersona = new Set(
      empleados
        .map((empleado) => empleado.idPersona)
        .filter((value) => value !== undefined && value !== null)
        .map((value) => String(value))
    )

    return ensureArray(socios)
      .map((socio) => {
        const persona = normalizePersona(socio.Persona || socio.persona)
        return {
          ...socio,
          idSocio: pickFirst(socio.idSocio, socio.IdSocio, socio.id),
          idPersona: pickFirst(socio.idPersona, socio.IdPersona, persona?.idPersona),
          Persona: persona
        }
      })
      .filter((socio) => socio.idSocio != null && socio.idPersona != null)
      .filter((socio) => !empleadosPorPersona.has(String(socio.idPersona)))
      .sort((a, b) =>
        `${a.Persona?.Apellido || ''} ${a.Persona?.Nombre || ''}`.localeCompare(
          `${b.Persona?.Apellido || ''} ${b.Persona?.Nombre || ''}`,
          'es'
        )
      )
  }, [empleados, socios])

  const crearEmpleado = useCallback(
    async (payload) => {
      const empleado = await jsonFetch(apiUrl('/empleado'), {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      await fetchEmpleados()
      return empleado
    },
    [fetchEmpleados]
  )

  const editarEmpleado = useCallback(
    async (idEmpleado, payload) => {
      const empleadoActualizado = await jsonFetch(apiUrl(`/empleado/${idEmpleado}`), {
        method: 'PUT',
        body: JSON.stringify({
          idCargo: Number(payload.idCargo),
          FechaDelInicio: payload.FechaDelInicio
        })
      })

      await fetchEmpleados()
      return empleadoActualizado
    },
    [fetchEmpleados]
  )

  const eliminarEmpleado = useCallback(async (idEmpleado) => {
    await jsonFetch(apiUrl(`/empleado/${idEmpleado}`), { method: 'DELETE' })
    setEmpleados((prev) => prev.filter((empleado) => empleado.idEmpleado !== idEmpleado))
  }, [])

  const toggleEstadoEmpleado = useCallback(async (idEmpleado) => {
    await jsonFetch(apiUrl(`/empleado/estado/${idEmpleado}`), { method: 'PUT' })
    setEmpleados((prev) =>
      prev.map((empleado) =>
        empleado.idEmpleado === idEmpleado ? { ...empleado, Activo: !empleado.Activo } : empleado
      )
    )
  }, [])

  useEffect(() => {
    if (!autoLoad) return
    fetchEmpleados()
    fetchCatalogos()
  }, [autoLoad, fetchCatalogos, fetchEmpleados])

  return {
    empleados,
    cargos,
    personasRegistradas,
    sociosDisponibles,
    loading,
    loadingCatalogos,
    catalogosError,
    fetchEmpleados,
    fetchCatalogos,
    crearEmpleado,
    editarEmpleado,
    eliminarEmpleado,
    toggleEstadoEmpleado
  }
}
