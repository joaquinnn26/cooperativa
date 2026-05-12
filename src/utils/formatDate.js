export function formatDate(date, locale = 'es-ES', options) {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  })
}
