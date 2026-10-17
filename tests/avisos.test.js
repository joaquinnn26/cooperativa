import test from 'node:test'
import assert from 'node:assert/strict'
import { createAvisosApi, AvisosError } from '../src/features/avisos/avisosApi.js'
import { createAvisosSession } from '../src/features/avisos/avisosSession.js'
import { puedeConsultarAvisos, destinoAviso } from '../src/features/avisos/avisosModel.js'

const notice = (id = 1, extra = {}) => ({
  idAviso: id, Ambito: 'Personal', TipoAviso: 'TurnoAprobado', Titulo: 'Turno aprobado',
  Mensaje: 'Tu turno fue aprobado.', Prioridad: 2, TipoOrigen: 'Turno', idOrigen: '100',
  FechaCreacionUtc: '2026-10-17T12:00:00Z', FechaLecturaUtc: null, FechaArchivoUtc: null,
  RequiereAccion: false, ...extra
})
const page = (items = [], options = {}) => ({
  items, total: items.length, pagina: 1, tamanoPagina: 5, incluirArchivados: false, ...options
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
function fixture() {
  let items = [notice(), notice(2, { FechaLecturaUtc: '2026-10-17T13:00:00Z' })]
  const calls = []
  const api = {
    async list(options = {}) {
      calls.push(['list', options])
      const filtered = items.filter(item => options.incluirArchivados || !item.FechaArchivoUtc)
      const size = options.tamanoPagina ?? 5, number = options.pagina ?? 1
      return page(filtered.slice((number - 1) * size, number * size), {
        total: filtered.length, pagina: number, tamanoPagina: size,
        incluirArchivados: options.incluirArchivados ?? false
      })
    },
    async summary() { calls.push(['summary']); return items.filter(item => !item.FechaLecturaUtc && !item.FechaArchivoUtc).length },
    async mark(id, archived) {
      calls.push(['mark', id, archived])
      const item = items.find(item => item.idAviso === id)
      const field = archived ? 'FechaArchivoUtc' : 'FechaLecturaUtc'
      item[field] ||= '2026-10-17T14:00:00Z'
      return { ...item }
    }
  }
  return { api, calls, get items() { return items }, set items(value) { items = value } }
}

test('habilita solo la sesión personal verificada, sin altas pendientes o rechazadas', () => {
  const session = { token: 'simulado', sessionStatus: 'authenticated', rol: 'Socio', idSocio: '1' }
  assert.equal(puedeConsultarAvisos(session), true)
  for (const Estado of ['PendienteDocumentacion', 'EnRevision', 'Rechazada']) {
    assert.equal(puedeConsultarAvisos({ ...session, altaSocio: { Estado } }), false)
  }
  for (const change of [{ token: null }, { sessionStatus: 'checking' }, { rol: 'Empleado' }, { rol: 'Administrador' }, { idSocio: null }]) {
    assert.equal(puedeConsultarAvisos({ ...session, ...change }), false)
  }
})

test('navega únicamente al listado real de turnos, nunca a URLs o ámbitos ajenos', () => {
  assert.equal(destinoAviso(notice()), '/socio/turnos')
  for (const extra of [{ Ambito: 'Laboral' }, { TipoOrigen: 'Factura' }, { idOrigen: 'https://externo.invalid' }]) {
    assert.equal(destinoAviso(notice(1, extra)), null)
  }
})

test('cliente usa JWT, contratos reales, paginación y PUT sin enviar destinatario', async () => {
  const calls = []
  const api = createAvisosApi({ token: 'prueba-sin-valor-real', url: path => path, fetchImpl: async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => url.includes('/resumen') ? { noLeidos: 3 }
      : options.method === 'PUT' ? notice() : page([notice()], { pagina: 2, tamanoPagina: 10, incluirArchivados: true }) }
  } })
  assert.equal((await api.list({ pagina: 2, tamanoPagina: 10, incluirArchivados: true })).pagina, 2)
  assert.equal(await api.summary(), 3)
  await api.mark(1, false)
  await api.mark(1, true)
  assert.match(calls[0].url, /pagina=2&tamanoPagina=10&incluirArchivados=true/)
  assert.equal(calls[2].url, '/avisos/1/leido')
  assert.equal(calls[3].url, '/avisos/1/archivado')
  assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer prueba-sin-valor-real'))
  assert.ok(calls.every(call => !call.url.includes('idUsuarioSistema') && !call.options.body))
})

test('cliente distingue errores HTTP sin exponer el cuerpo interno de la API', async () => {
  for (const status of [401, 403, 404, 500]) {
    const api = createAvisosApi({ token: 'mock', url: path => path, fetchImpl: async () => ({ ok: false, status }) })
    await assert.rejects(api.summary(), error => error instanceof AvisosError && error.status === status)
  }
})

test('404 del listado o resumen informa indisponibilidad, no pérdida de acceso a un aviso individual', async () => {
  const api = createAvisosApi({ token: 'mock', url: path => path,
    fetchImpl: async () => ({ ok: false, status: 404 }) })
  const unavailable = error => error.status === 404 &&
    error.message.includes('La consulta de avisos no está disponible') &&
    !error.message.includes('no tenés acceso al trámite')
  await assert.rejects(api.list(), unavailable)
  await assert.rejects(api.summary(), unavailable)
})

test('404 al leer o archivar conserva el mensaje de aviso inexistente o inaccesible', async () => {
  const api = createAvisosApi({ token: 'mock', url: path => path,
    fetchImpl: async () => ({ ok: false, status: 404 }) })
  const missing = error => error.status === 404 &&
    error.message === 'El aviso ya no está disponible o no tenés acceso al trámite.'
  await assert.rejects(api.mark(1, false), missing)
  await assert.rejects(api.mark(1, true), missing)
})

test('rechaza respuestas inválidas, avisos laborales y avisos PUT de otro identificador', async () => {
  for (const data of [null, page([notice(1, { Ambito: 'Laboral' })]), page([notice(1, { FechaLecturaUtc: undefined })])]) {
    const api = createAvisosApi({ token: 'mock', url: path => path, fetchImpl: async () => ({ ok: true, json: async () => data }) })
    await assert.rejects(api.list(), AvisosError)
  }
  const api = createAvisosApi({ token: 'mock', url: path => path, fetchImpl: async () => ({ ok: true, json: async () => notice(2) }) })
  await assert.rejects(api.mark(1, false), /diferente/)
})

test('estado vacío se distingue de error y abrir/consultar no marca avisos', async () => {
  const f = fixture(); f.items = []
  const session = createAvisosSession(f.api)
  await session.refresh()
  assert.equal(session.getSnapshot().status, 'ready')
  assert.equal(session.getSnapshot().noLeidos, 0)
  assert.deepEqual(session.getSnapshot().items, [])
  assert.equal(f.calls.filter(call => call[0] === 'mark').length, 0)
  f.api.summary = async () => { throw new AvisosError('Servicio no disponible', 500) }
  await session.refresh(true)
  assert.equal(session.getSnapshot().status, 'error')
  assert.equal(session.getSnapshot().noLeidos, null)
  assert.match(session.getSnapshot().error, /no disponible/)
})

test('lectura y archivo son independientes y sincronizan contador e historial', async () => {
  const f = fixture(), session = createAvisosSession(f.api)
  await session.refresh()
  assert.equal(session.getSnapshot().noLeidos, 1)
  await session.loadHistory({ incluirArchivados: true })
  await session.mark(1, true)
  assert.equal(f.items[0].FechaLecturaUtc, null)
  assert.equal(session.getSnapshot().items.length, 1)
  assert.equal(session.getSnapshot().history.items.length, 2)
  assert.equal(session.getSnapshot().noLeidos, 0)
  await session.mark(2, false)
  assert.equal(f.items[1].FechaArchivoUtc, null)
})

test('historial pagina con diez elementos y permite incluir archivados', async () => {
  const f = fixture(); f.items = Array.from({ length: 23 }, (_, i) => notice(i + 1))
  const session = createAvisosSession(f.api)
  await session.loadHistory({ pagina: 2, incluirArchivados: true })
  assert.equal(session.getSnapshot().history.total, 23)
  assert.equal(session.getSnapshot().history.items[0].idAviso, 11)
  assert.equal(session.getSnapshot().history.items.length, 10)
  assert.equal(session.getSnapshot().history.incluirArchivados, true)
})

test('foco repetido y solicitudes simultáneas comparten consulta y respetan el intervalo', async () => {
  const f = fixture(), pending = deferred()
  let clock = 10000
  f.api.summary = () => pending.promise
  const session = createAvisosSession(f.api, { now: () => clock })
  const first = session.refresh(), second = session.refresh()
  assert.equal(first, second)
  pending.resolve(1); await first
  await session.poll(); assert.equal(f.calls.length, 1)
  clock += 60000
  await session.poll(); assert.equal(f.calls.length, 2)
})

test('logout borra datos y descarta respuestas tardías; otra sesión empieza vacía', async () => {
  const f = fixture(), pending = deferred()
  f.api.list = () => pending.promise
  let current = true
  const session = createAvisosSession(f.api, { isCurrent: () => current })
  const flight = session.refresh()
  current = false; session.dispose()
  pending.resolve(page([notice()])); await flight
  assert.deepEqual(session.getSnapshot().items, [])
  assert.equal(session.getSnapshot().noLeidos, null)
  const next = createAvisosSession(fixture().api)
  assert.notEqual(next.scope, session.scope)
  assert.deepEqual(next.getSnapshot().items, [])
})

test('StrictMode puede reiniciar el efecto y descarta la consulta anterior abortada', async () => {
  const f = fixture(), first = deferred()
  let requests = 0
  const list = f.api.list
  f.api.list = options => ++requests === 1 ? first.promise : list(options)
  const session = createAvisosSession(f.api)
  const old = session.refresh()
  session.dispose(); session.start()
  await session.refresh(true)
  first.resolve(page([notice(999)])); await old
  assert.equal(session.getSnapshot().status, 'ready')
  assert.equal(session.getSnapshot().items[0].idAviso, 1)
})

test('403 limpia toda la información y detiene futuras consultas de esa sesión', async () => {
  const f = fixture(), session = createAvisosSession(f.api)
  await session.refresh(); await session.loadHistory()
  f.api.summary = async () => { throw new AvisosError('Sin acceso', 403) }
  await session.refresh(true)
  assert.deepEqual(session.getSnapshot().history.items, [])
  assert.equal(session.getSnapshot().noLeidos, null)
  const calls = f.calls.length
  await session.refresh(true); await session.loadHistory()
  assert.equal(f.calls.length, calls)
})

test('un aviso inaccesible no habilita navegación y provoca una consulta actualizada', async () => {
  const f = fixture(), session = createAvisosSession(f.api)
  await session.refresh()
  f.api.mark = async () => { throw new AvisosError('Sin acceso al turno', 404) }
  f.items = []
  assert.equal(await session.mark(1), false)
  assert.deepEqual(session.getSnapshot().items, [])
  assert.match(session.getSnapshot().actionError, /Sin acceso/)
})

test('mutaciones simultáneas no envían duplicados y un fallo no deja un spinner permanente', async () => {
  const f = fixture(), pending = deferred(), session = createAvisosSession(f.api)
  f.api.mark = () => pending.promise
  const first = session.mark(1)
  assert.equal(await session.mark(1), false)
  pending.reject(new AvisosError('No se pudo guardar', 500))
  assert.equal(await first, false)
  assert.equal(session.getSnapshot().busy, null)
  assert.equal(session.getSnapshot().status, 'ready')
  assert.match(session.getSnapshot().actionError, /guardar/)
})

test('una consulta anterior a una lectura no restaura datos viejos al responder tarde', async () => {
  const f = fixture(), pending = deferred(), list = f.api.list
  let calls = 0
  f.api.list = options => ++calls === 1 ? pending.promise : list(options)
  const session = createAvisosSession(f.api)
  const stale = session.refresh()
  await session.mark(1)
  pending.resolve(page([notice()]))
  await stale
  assert.ok(session.getSnapshot().items[0].FechaLecturaUtc)
  assert.equal(session.getSnapshot().noLeidos, 0)
})

test('una página de historial tardía no reemplaza la página seleccionada después', async () => {
  const f = fixture(), pending = deferred(), list = f.api.list
  f.items = Array.from({ length: 15 }, (_, i) => notice(i + 1))
  f.api.list = options => options.pagina === 1 ? pending.promise : list(options)
  const session = createAvisosSession(f.api)
  const stale = session.loadHistory({ pagina: 1 })
  await session.loadHistory({ pagina: 2 })
  pending.resolve(page([notice()], { tamanoPagina: 10 }))
  await stale
  assert.equal(session.getSnapshot().history.pagina, 2)
  assert.equal(session.getSnapshot().history.items[0].idAviso, 11)
})

test('cerrar o cambiar de cuenta durante un PUT impide navegar con su respuesta tardía', async () => {
  const f = fixture(), pending = deferred()
  let current = true
  f.api.mark = () => pending.promise
  const session = createAvisosSession(f.api, { isCurrent: () => current })
  const mutation = session.mark(1)
  current = false; session.dispose()
  pending.resolve(notice(1, { FechaLecturaUtc: '2026-10-17T15:00:00Z' }))
  assert.equal(await mutation, false)
  assert.deepEqual(session.getSnapshot().items, [])
})
