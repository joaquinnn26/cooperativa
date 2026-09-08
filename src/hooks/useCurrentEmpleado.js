import { useCallback, useEffect, useState } from 'react'
import useAuthStore from '@/store/authStore.js'
import { useEmpleados } from '@/hooks/useEmpleados.js'

export function useCurrentEmpleado() {
  const usuario = useAuthStore((state) => state.usuario)
  const rol = useAuthStore((state) => state.rol)
  const storedEmpleadoId = useAuthStore((state) => state.idEmpleado)
  const setResolvedEmpleadoId = useAuthStore((state) => state.setResolvedEmpleadoId)
  const { fetchEmpleados } = useEmpleados(false)

  const [empleadoId, setEmpleadoId] = useState(() => {
    const numericId = Number(storedEmpleadoId)
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null
  })
  const [loadingEmpleado, setLoadingEmpleado] = useState(false)

  const resolveEmpleadoId = useCallback(async () => {
    const numericId = Number(storedEmpleadoId)
    if (Number.isInteger(numericId) && numericId > 0) {
      setEmpleadoId(numericId)
      return numericId
    }

    if (!usuario || rol !== 'Empleado') {
      setEmpleadoId(null)
      setResolvedEmpleadoId(null)
      return null
    }

    setLoadingEmpleado(true)

    try {
      const empleados = await fetchEmpleados()
      const empleadoActual = (empleados || []).find(
        (empleado) => String(empleado.Persona?.Documento) === String(usuario)
      )
      const resolvedId = empleadoActual?.idEmpleado ?? null

      setEmpleadoId(resolvedId)
      setResolvedEmpleadoId(resolvedId)
      return resolvedId
    } finally {
      setLoadingEmpleado(false)
    }
  }, [fetchEmpleados, rol, setResolvedEmpleadoId, storedEmpleadoId, usuario])

  useEffect(() => {
    resolveEmpleadoId().catch((error) => {
      console.error('Error al resolver idEmpleado actual:', error)
      setEmpleadoId(null)
    })
  }, [resolveEmpleadoId])

  return { empleadoId, loadingEmpleado, resolveEmpleadoId }
}
