// One instance per verified account/session. No localStorage or persistent cache.
let nextScope = 0
export function createAvisosSession(api, { isCurrent = () => true, now = Date.now } = {}) {
  const scope = ++nextScope
  let state = {
    items: [], noLeidos: null, status: 'idle', error: '', actionError: '', busy: null,
    history: { items: [], total: 0, pagina: 1, incluirArchivados: false, status: 'idle', error: '' }
  }
  let disposed = false, blocked = false, recentVersion = 0, historyVersion = 0
  let recentFlight, lastRefresh = -Infinity, historyActive = false, mutating = false
  const listeners = new Set(), controllers = new Set()
  const valid = () => !disposed && isCurrent()
  const publish = patch => {
    if (!valid()) return
    state = { ...state, ...patch }
    listeners.forEach(listener => listener())
  }
  const abort = () => { controllers.forEach(controller => controller.abort()); controllers.clear() }
  function failure(error, history = false) {
    if (!valid() || error.name === 'AbortError') return
    if ([401, 403].includes(error.status)) {
      blocked = true
      abort()
      publish({ items: [], noLeidos: null, status: 'error', error: error.message,
        history: { ...state.history, items: [], total: 0, status: 'error', error: error.message } })
    } else if (history) {
      publish({ history: { ...state.history, items: [], total: 0, status: 'error', error: error.message } })
    } else publish({ items: [], noLeidos: null, status: 'error', error: error.message })
  }
  async function loadHistory({ pagina = state.history.pagina, incluirArchivados = state.history.incluirArchivados } = {}) {
    if (!valid() || blocked) return
    historyActive = true
    const version = ++historyVersion, controller = new AbortController()
    controllers.add(controller)
    publish({ history: { items: [], total: 0, pagina, incluirArchivados, status: 'loading', error: '' } })
    try {
      const data = await api.list({ pagina, incluirArchivados, tamanoPagina: 10, signal: controller.signal })
      if (valid() && version === historyVersion && !blocked) {
        publish({ history: { ...data, status: 'ready', error: '' } })
      }
    } catch (error) { if (version === historyVersion) failure(error, true) }
    finally { controllers.delete(controller) }
  }
  function refresh(force = false) {
    if (!valid() || blocked || state.busy !== null) return Promise.resolve()
    if (recentFlight) return recentFlight
    if (!force && now() - lastRefresh < 10000) return Promise.resolve()
    lastRefresh = now()
    const version = ++recentVersion, controller = new AbortController()
    controllers.add(controller)
    publish({ status: 'loading', error: '' })
    const flight = (async () => {
      try {
        const [page, noLeidos] = await Promise.all([
          api.list({ signal: controller.signal }), api.summary({ signal: controller.signal })
        ])
        if (valid() && version === recentVersion && !blocked) {
          publish({ items: page.items, noLeidos, status: 'ready', error: '' })
        }
      } catch (error) { if (version === recentVersion) failure(error) }
      finally { controllers.delete(controller); if (recentFlight === flight) recentFlight = null }
    })()
    recentFlight = flight
    return flight
  }
  async function mark(id, archived = false) {
    if (!valid() || blocked || mutating) return false
    mutating = true
    // Discard GETs started before the mutation; late responses cannot undo it.
    ++recentVersion; ++historyVersion; abort(); recentFlight = null
    const controller = new AbortController()
    controllers.add(controller)
    publish({ busy: id, actionError: '' })
    try {
      await api.mark(id, archived, { signal: controller.signal })
      if (!valid()) return false
      publish({ busy: null })
      await Promise.all([refresh(true), ...(historyActive ? [loadHistory()] : [])])
      return valid() && !blocked
    } catch (error) {
      if (valid() && error.name !== 'AbortError') {
        publish({ actionError: error.message })
        if ([401, 403].includes(error.status)) failure(error)
        if (![401, 403].includes(error.status)) {
          publish({ busy: null })
          await Promise.all([refresh(true), ...(historyActive ? [loadHistory()] : [])])
        }
      }
      return false
    } finally { controllers.delete(controller); mutating = false; publish({ busy: null }) }
  }
  return {
    scope,
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
    refresh, loadHistory, mark,
    stopHistory() { historyActive = false; ++historyVersion },
    async poll() {
      if (!valid() || blocked || recentFlight || now() - lastRefresh < 10000) return
      await refresh()
      if (historyActive && valid() && !blocked && state.busy === null) await loadHistory()
    },
    start() { disposed = false; blocked = false; lastRefresh = -Infinity },
    dispose() {
      disposed = true; ++recentVersion; ++historyVersion; abort(); recentFlight = null; listeners.clear()
      state = { ...state, items: [], noLeidos: null, actionError: '', busy: null,
        history: { ...state.history, items: [], total: 0 } }
    }
  }
}
