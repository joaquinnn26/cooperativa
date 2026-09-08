export function normalizeServiceText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function isInternetService(serviceName) {
  const normalized = normalizeServiceText(serviceName)
  return normalized.includes('internet') || normalized.includes('wifi') || normalized.includes('fibra')
}

export function serviceRequiresMeter(serviceName) {
  const normalized = normalizeServiceText(serviceName)
  if (isInternetService(normalized)) return false
  return normalized.includes('agua') || normalized.includes('luz') || normalized.includes('electric')
}

export function serviceRequiresInstallation(serviceName) {
  return serviceRequiresMeter(serviceName) || isInternetService(serviceName)
}
