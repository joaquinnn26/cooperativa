export function normalizeRouteText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function isRouteEmployeeActive(employee) {
  return employee?.Activo !== false
}

export function isMeterReader(employee) {
  return normalizeRouteText(employee?.Cargo?.Nombre).includes('lecturista')
}

export function getAssignableRouteEmployees(employees) {
  return (Array.isArray(employees) ? employees : [])
    .filter(isRouteEmployeeActive)
    .sort((left, right) => {
      const readerDifference = Number(isMeterReader(right)) - Number(isMeterReader(left))
      if (readerDifference !== 0) return readerDifference

      const leftName = `${left?.Persona?.Apellido || ''} ${left?.Persona?.Nombre || ''}`.trim()
      const rightName = `${right?.Persona?.Apellido || ''} ${right?.Persona?.Nombre || ''}`.trim()
      return leftName.localeCompare(rightName, 'es')
    })
}
