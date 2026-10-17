import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '@/config/api.js'
import { fetchPublicAnnouncements } from './publicAnnouncements.js'
import { visibleAnnouncements } from './announcementRules.js'

export function usePublicAnnouncements() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(Date.now())
  const retry = () => setRevision(value => value + 1)
  useEffect(() => {
    const controller = new AbortController()
    fetchPublicAnnouncements(apiUrl('/anuncios'), { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setItems(data); setStatus('ready') } })
      .catch(() => { if (!controller.signal.aborted) { setItems([]); setStatus('error') } })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    const timer = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(clock); clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  return { items: useMemo(() => visibleAnnouncements(items, now), [items, now]), status, retry }
}
