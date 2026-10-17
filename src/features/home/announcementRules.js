const zone = 'America/Argentina/Buenos_Aires'
const ranks = { high: 0, medium: 1, low: 2 }

export function validAnnouncementDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= '0001-01-01' && value < '9999-12-31'
}

export function announcementTimestamp(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!validAnnouncementDay(value)) return NaN
    // The current API compares stored dates directly with UTC, without extending the end day.
    return Date.parse(`${value}T00:00:00Z`)
  }
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
}

export function announcementDay(value) {
  if (!value) return ''
  // Start/end fields represent calendar dates. Preserve the API's day when editing.
  const day = String(value).slice(0, 10)
  return validAnnouncementDay(day) ? day : ''
}

export function announcementState(item, now = Date.now()) {
  if (item.active === false) return 'inactive'
  const start = announcementTimestamp(item.startsAt)
  const end = announcementTimestamp(item.endsAt)
  if (Number.isNaN(start) || Number.isNaN(end) || (end !== null && end < now)) return 'expired'
  if (start !== null && start > now) return 'scheduled'
  return 'current'
}

export function visibleAnnouncements(items, now = Date.now()) {
  return items.filter(item => announcementState(item, now) === 'current').sort((a, b) =>
    Number(Boolean(b.fixed)) - Number(Boolean(a.fixed)) ||
    (ranks[a.priority] ?? 1) - (ranks[b.priority] ?? 1) ||
    (announcementTimestamp(b.date) || 0) - (announcementTimestamp(a.date) || 0))
}

export function announcementDateLabel(value) {
  const day = announcementDay(value)
  return day ? new Date(`${day}T12:00:00-03:00`).toLocaleDateString('es-AR', { timeZone: zone }) : ''
}

export function announcementPublicationDateLabel(value) {
  if (!value) return ''
  const date = new Date(announcementTimestamp(value))
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR', { timeZone: zone })
}
