const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const NAME_RE = /^\p{L}+(?:[ '-]\p{L}+)*$/u
const ADDRESS_RE = /^[\p{L}0-9 .'-]+$/u
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const LETTER_RE = /\p{L}/u
const SERVICE_NAME_RE = /^[\p{L}0-9 .,'()/-]+$/u

export const FIELD_LIMITS = {
  personName: { min: 2, max: 60 },
  document: { min: 7, max: 9 },
  phone: { min: 7, max: 20 },
  email: { min: 6, max: 120 },
  address: { min: 2, max: 100 },
  houseNumber: { min: 1, max: 7 },
  password: { min: 8, max: 64 },
  token: { min: 6, max: 200 },
  serviceName: { min: 3, max: 80 },
  shortTitle: { min: 5, max: 120 },
  description: { min: 10, max: 500 },
  longText: { min: 10, max: 800 },
  announcement: { min: 10, max: 1000 },
  rejectionReason: { min: 10, max: 300 },
  routeName: { min: 5, max: 120 },
  observation: { min: 5, max: 500 },
  url: { min: 10, max: 300 },
  meterType: { min: 3, max: 80 }
}

export function cleanText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function isBlank(value) {
  return cleanText(value) === ''
}

export function isValidEmail(value) {
  const text = cleanText(value)
  return text.length >= FIELD_LIMITS.email.min && text.length <= FIELD_LIMITS.email.max && EMAIL_RE.test(text)
}

export function isValidPersonName(value) {
  const text = cleanText(value)
  return text.length >= FIELD_LIMITS.personName.min && text.length <= FIELD_LIMITS.personName.max && NAME_RE.test(text)
}

export function isValidDocument(value) {
  return new RegExp(`^\\d{${FIELD_LIMITS.document.min},${FIELD_LIMITS.document.max}}$`).test(cleanText(value))
}

export function isValidPhone(value) {
  const text = cleanText(value)
  return text.length >= FIELD_LIMITS.phone.min && text.length <= FIELD_LIMITS.phone.max && /^[0-9+() -]+$/.test(text)
}

export function isValidAddress(value) {
  const text = cleanText(value)
  return text.length >= FIELD_LIMITS.address.min && text.length <= FIELD_LIMITS.address.max && ADDRESS_RE.test(text)
}

export function isMeaningfulText(value, { min = 3, max = 500, requireLetter = true } = {}) {
  const text = cleanText(value)
  if (text.length < min || text.length > max) return false
  return !requireLetter || LETTER_RE.test(text)
}

export function isValidServiceName(value) {
  const text = cleanText(value)
  return text.length >= FIELD_LIMITS.serviceName.min && text.length <= FIELD_LIMITS.serviceName.max && LETTER_RE.test(text) && SERVICE_NAME_RE.test(text)
}

export function isValidHouseNumber(value) {
  const text = cleanText(value)
  return text.length >= FIELD_LIMITS.houseNumber.min && text.length <= FIELD_LIMITS.houseNumber.max && /^\d{1,6}[A-Za-z]?$/.test(text)
}

export function isStrongPassword(value) {
  const text = String(value ?? '')
  return text.length <= FIELD_LIMITS.password.max && PASSWORD_RE.test(text)
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
  const date = parseDateValue(value)
  return !Number.isNaN(date.getTime())
}

function parseDateValue(value) {
  const text = cleanText(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

export function isTodayOrFuture(value) {
  if (!isValidDate(value)) return false
  const input = parseDateValue(value)
  const today = new Date()
  input.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return input >= today
}

export function isTodayOrPast(value) {
  if (!isValidDate(value)) return false
  const input = parseDateValue(value)
  const today = new Date()
  input.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return input <= today
}

export function validateRequired(value, label) {
  return isBlank(value) ? `${label} es obligatorio.` : ''
}

export function validateEmail(value, label = 'El correo electronico') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidEmail(value)
    ? ''
    : `${label} debe tener entre ${FIELD_LIMITS.email.min} y ${FIELD_LIMITS.email.max} caracteres y un formato valido.`
}

export function validatePersonName(value, label) {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidPersonName(value)
    ? ''
    : `${label} debe tener entre ${FIELD_LIMITS.personName.min} y ${FIELD_LIMITS.personName.max} caracteres y contener solo letras y espacios.`
}

export function validateServiceName(value, label = 'El nombre del servicio') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidServiceName(value)
    ? ''
    : `${label} debe tener entre 3 y 80 caracteres, incluir letras y no puede ser solo numeros.`
}

export function validateMeaningfulText(value, label, options = {}) {
  if (isBlank(value)) return `${label} es obligatorio.`
  const { min = 3, max = 500, requireLetter = true } = options
  if (!isMeaningfulText(value, { min, max, requireLetter })) {
    return `${label} debe tener entre ${min} y ${max} caracteres${requireLetter ? ' e incluir al menos una letra' : ''}.`
  }
  return ''
}

export function validateDocument(value, label = 'El documento') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidDocument(value)
    ? ''
    : `${label} debe contener entre ${FIELD_LIMITS.document.min} y ${FIELD_LIMITS.document.max} numeros.`
}

export function validatePhone(value, label = 'El telefono') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidPhone(value)
    ? ''
    : `${label} debe tener entre ${FIELD_LIMITS.phone.min} y ${FIELD_LIMITS.phone.max} caracteres y solo puede contener numeros, espacios, +, guiones y parentesis.`
}

export function validateAddress(value, label = 'La calle') {
  if (isBlank(value)) return `${label} es obligatoria.`
  return isValidAddress(value)
    ? ''
    : `${label} debe tener entre ${FIELD_LIMITS.address.min} y ${FIELD_LIMITS.address.max} caracteres y solo puede contener letras, numeros, espacios, puntos, guiones y apostrofes.`
}

export function validateHouseNumber(value, label = 'El numero de domicilio') {
  if (isBlank(value)) return `${label} es obligatorio.`
  return isValidHouseNumber(value)
    ? ''
    : `${label} debe tener entre ${FIELD_LIMITS.houseNumber.min} y ${FIELD_LIMITS.houseNumber.max} caracteres y usar un numero, opcionalmente con una letra al final.`
}

export function validateStrongPassword(value, label = 'La contrasena') {
  if (isBlank(value)) return `${label} es obligatoria.`
  return isStrongPassword(value)
    ? ''
    : `${label} debe tener entre ${FIELD_LIMITS.password.min} y ${FIELD_LIMITS.password.max} caracteres, una mayuscula, una minuscula, un numero y un simbolo.`
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
