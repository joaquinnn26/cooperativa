const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const NAME_RE = /^\p{L}+(?:[ '-]\p{L}+)*$/u
const ADDRESS_RE = /^[\p{L}0-9 .'-]+$/u
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export function cleanText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function isBlank(value) {
  return cleanText(value) === ''
}

export function isValidEmail(value) {
  return EMAIL_RE.test(cleanText(value))
}

export function isValidPersonName(value) {
  const text = cleanText(value)
  return text.length >= 2 && text.length <= 60 && NAME_RE.test(text)
}

export function isValidDocument(value) {
  return /^\d{7,9}$/.test(cleanText(value))
}

export function isValidPhone(value) {
  return /^[0-9+() -]{7,20}$/.test(cleanText(value))
}

export function isValidAddress(value) {
  const text = cleanText(value)
  return text.length >= 2 && text.length <= 100 && ADDRESS_RE.test(text)
}

export function isValidHouseNumber(value) {
  return /^\d{1,6}[A-Za-z]?$/.test(cleanText(value))
}

export function isStrongPassword(value) {
  return PASSWORD_RE.test(String(value ?? ''))
}

export function isPositiveNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0
}

export function isNonNegativeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

export function isValidDate(value) {
  if (isBlank(value)) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

export function isTodayOrFuture(value) {
  if (!isValidDate(value)) return false
  const input = new Date(value)
  const today = new Date()
  input.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return input >= today
}

export function validateRequired(value, label) {
  return isBlank(value) ? `${label} es obligatorio.` : ''
}

export function validateEmail(value, label = 'El correo electronico') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidEmail(value) ? '' : `${label} no tiene un formato valido.`
}

export function validatePersonName(value, label) {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidPersonName(value) ? '' : `${label} debe contener solo letras y espacios.`
}

export function validateDocument(value, label = 'El documento') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidDocument(value) ? '' : `${label} debe contener entre 7 y 9 numeros.`
}

export function validatePhone(value, label = 'El telefono') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidPhone(value) ? '' : `${label} solo puede contener numeros, espacios, +, guiones y parentesis.`
}

export function validateStrongPassword(value, label = 'La contrasena') {
  if (isBlank(value)) return `${label} es obligatoria.`
  return isStrongPassword(value)
    ? ''
    : `${label} debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo.`
}

export function firstValidationError(validations) {
  for (const validation of validations) {
    const error = typeof validation === 'function' ? validation() : validation
    if (error) return error
  }
  return ''
}

export function sanitizePersonPayload(payload) {
  return {
    ...payload,
    Nombre: cleanText(payload.Nombre ?? payload.nombre),
    Apellido: cleanText(payload.Apellido ?? payload.apellido),
    Documento: cleanText(payload.Documento ?? payload.documento),
    Telefono: cleanText(payload.Telefono ?? payload.telefono),
    Email: cleanText(payload.Email ?? payload.email).toLowerCase(),
    Calle: cleanText(payload.Calle ?? payload.calle),
    Numero: cleanText(payload.Numero ?? payload.numero)
  }
}
