import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Megaphone, X } from 'lucide-react'
import useCooperativeStore from '@/store/cooperativeStore.js'
import { formatDate } from '@/utils/formatDate.js'

function bannerClasses(priority) {
  if (priority === 'high') return 'border-red-200 bg-red-50 text-red-950'
  if (priority === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-950'
  return 'border-blue-200 bg-blue-50 text-blue-950'
}

export default function PublicAnnouncementsBanner() {
  const fetchAnnouncements = useCooperativeStore((state) => state.fetchAnnouncements)
  const [announcements, setAnnouncements] = useState([])
  const [dismissedId, setDismissedId] = useState(null)

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
  }, [fetchAnnouncements])

  const announcement = useMemo(() => {
    const ordered = [...announcements].sort((a, b) => {
      if (a.fixed !== b.fixed) return a.fixed ? -1 : 1
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1
      return new Date(b.date || 0) - new Date(a.date || 0)
    })

    return ordered[0] || null
  }, [announcements])

  if (!announcement || dismissedId === announcement.id) return null

  const Icon = announcement.priority === 'high' ? AlertTriangle : Megaphone

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
            onClick={() => setDismissedId(announcement.id)}
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
