import test from 'node:test'
import assert from 'node:assert/strict'
import { CHAT_TOPICS, getChatReply, getChatLink } from '../src/utils/chatbot.js'

test('reconoce consultas con tildes, signos y mayúsculas', () => {
  assert.equal(getChatReply('¿Cómo recupero mi CONTRASEÑA?').id, 'acceso')
  assert.equal(getChatReply('Quiero consultar mis mediciones.').id, 'mediciones')
})

test('cada botón sugerido responde con el tema correcto', () => {
  for (const topic of CHAT_TOPICS) assert.equal(getChatReply(topic.label).id, topic.id)
})

test('no inventa respuestas para consultas desconocidas ni envía preguntas vacías', () => {
  assert.equal(getChatReply('   '), null)
  assert.equal(getChatReply('pronóstico del tiempo').link.to, '/ayuda')
  assert.equal(getChatReply('retornos').id, undefined)
})

test('los enlaces personales respetan el acceso y conservan el destino del socio', () => {
  const link = CHAT_TOPICS[0].link
  assert.equal(getChatLink(link, 'Socio').to, '/socio/turnos')
  assert.equal(getChatLink(link, null).to, '/login')
  assert.equal(getChatLink(link, null).state.from.pathname, '/socio/turnos')
  assert.equal(getChatLink(link, 'Empleado').to, '/ayuda')
})

test('distingue las nueve preguntas nuevas de los temas generales', () => {
  const questions = [
    ['¿Cómo actualizo mi teléfono o correo?', 'perfil'],
    ['¿Por qué rechazaron mi documentación?', 'documentos-rechazados'],
    ['¿Cómo sé si aprobaron mi solicitud de servicio?', 'estado-solicitud'],
    ['¿Cómo cancelo o consulto un turno?', 'consultar-cancelar-turno'],
    ['¿Dónde veo el avance de mi reclamo?', 'seguimiento-reclamo'],
    ['¿Qué hago si mi consumo parece incorrecto?', 'consumo-incorrecto'],
    ['¿Dónde queda la cooperativa y en qué horario atiende?', 'ubicacion'],
    ['¿A qué número llamo si se corta el agua o la luz?', 'contactos-guardias'],
    ['¿Qué significa que mi trámite está en revisión?', 'en-revision']
  ]
  for (const [question, id] of questions) assert.equal(getChatReply(question).id, id, question)
})

test('contactos, horarios y seguimiento no se confunden con solicitar un servicio', () => {
  const questions = [
    ['contactos y guardias', 'contactos-guardias'],
    ['horarios de internet', 'horarios'],
    ['quiero saber el estado de mis trámites', 'seguimiento-tramites'],
    ['mi consumo es muy alto', 'consumo-incorrecto'],
    ['quiero solicitar agua', 'servicios'],
    ['quiero presentar mis documentos', 'documentos'],
    ['quiero hacer un reclamo', 'reclamos'],
    ['recuperar contraseña', 'acceso'],
    ['cómo cambiar mi contraseña', 'acceso']
  ]
  for (const [question, id] of questions) assert.equal(getChatReply(question).id, id, question)
})

test('los contactos publicados no requieren sesión y las consultas personales sí', () => {
  const contacts = getChatReply('contactos y guardias')
  assert.equal(getChatLink(contacts.link, null).to, '/#atencion')
  for (const id of ['perfil', 'documentos-rechazados', 'estado-solicitud', 'consultar-cancelar-turno', 'seguimiento-reclamo', 'consumo-incorrecto', 'seguimiento-tramites']) {
    const topic = CHAT_TOPICS.find(item => item.id === id)
    assert.equal(getChatLink(topic.link, null).to, '/login')
    assert.equal(getChatLink(topic.link, 'Empleado').to, '/ayuda')
  }
})
