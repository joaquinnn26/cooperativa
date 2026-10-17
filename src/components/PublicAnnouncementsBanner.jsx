import React, { useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { usePublicAnnouncements } from '@/features/home/usePublicAnnouncements.js'
import { announcementState, announcementTimestamp } from '@/features/home/announcementRules.js'
import { formatDate } from '@/utils/formatDate.js'

const dismissedStorageKey = 'cospral.publicAnnouncements.dismissed.v1'
let memoryDismissedIds = new Set()

function readDismissedIds() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(dismissedStorageKey) || '[]')
    if (Array.isArray(stored)) {
      stored.forEach(id => {
        if (typeof id === 'string' || typeof id === 'number') memoryDismissedIds.add(String(id))
      })
    }
  } catch {
    // Keep dismissals in memory when browser storage is unavailable or malformed.
  }
  return new Set(memoryDismissedIds)
}

function bannerClasses(priority) {
  if (priority === 'high') return 'border-red-200 bg-red-50 text-red-950'
  if (priority === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-950'
  return 'border-blue-200 bg-blue-50 text-blue-950'
}

export default function PublicAnnouncementsBanner() {
  const { items: announcements } = usePublicAnnouncements()
  const [dismissedIds, setDismissedIds] = useState(readDismissedIds)

  const announcement = useMemo(() => {
    const ordered = announcements
      .filter(item => item.id != null && item.priority === 'high' && announcementState(item) === 'current' && !dismissedIds.has(String(item.id)))
      .sort((a, b) => (announcementTimestamp(b.date) || 0) - (announcementTimestamp(a.date) || 0))

    return ordered[0] || null
  }, [announcements, dismissedIds])

  const dismissAnnouncement = () => {
    const next = new Set([...memoryDismissedIds, ...dismissedIds, String(announcement.id)])
    memoryDismissedIds = next
    try {
      window.sessionStorage.setItem(dismissedStorageKey, JSON.stringify([...next]))
    } catch {
      // Closing still works for this page and subsequent mounts without storage.
    }
    setDismissedIds(next)
  }

  if (!announcement) return null

  const Icon = AlertTriangle

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className={`mx-auto max-w-5xl rounded-lg border p-3 shadow-lg ${bannerClasses(announcement.priority)}`}>
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">{announcement.title}</p>
            <p className="mt-1 text-sm leading-5">{announcement.content}</p>
            <p className="mt-1 text-xs opacity-80">Publicado: {formatDate(announcement.date, 'es-AR')}</p>
          </div>
          <button
            type="button"
            onClick={dismissAnnouncement}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 hover:bg-white"
            aria-label="Ocultar anuncio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
