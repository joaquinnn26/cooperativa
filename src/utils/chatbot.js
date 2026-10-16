export const CHAT_TOPICS = [
  {
    id: 'turnos', label: 'Pedir un turno',
    keywords: ['turno', 'turnos', 'cita', 'citas'],
    text: 'Para pedir un turno, ingresá como socio y abrí Mis turnos. Elegí un horario disponible y completá el motivo. Podés consultar el estado desde esa misma sección.',
    link: { to: '/socio/turnos', label: 'Ir a Mis turnos', personal: true }
  },
  {
    id: 'reclamos', label: 'Hacer un reclamo',
    keywords: ['reclamo', 'reclamos', 'reclamar', 'problema', 'corte', 'cortes', 'falla', 'fallas'],
    text: 'Ingresá como socio y abrí Nuevo reclamo. Seleccioná el tipo y describí lo que sucede. Después consultá el seguimiento en Mis reclamos. Este chat orienta: no registra reclamos ni atiende emergencias.',
    link: { to: '/socio/reclamos/nuevo', label: 'Abrir Nuevo reclamo', personal: true }
  },
  {
    id: 'servicios', label: 'Solicitar un servicio',
    keywords: ['servicio', 'servicios', 'solicitud', 'solicitudes', 'instalacion', 'instalar', 'agua', 'luz', 'energia', 'internet'],
    text: 'Desde tu cuenta de socio, entrá en Solicitudes de servicio y elegí Nuevo servicio. Consultá los requisitos del servicio seleccionado y completá la solicitud. Su avance se muestra en el listado de solicitudes.',
    link: { to: '/socio/solicitudes-servicio', label: 'Ver solicitudes de servicio', personal: true }
  },
  {
    id: 'facturas', label: 'Consultar facturas',
    keywords: ['factura', 'facturas', 'pago', 'pagos', 'pagar', 'deuda', 'deudas', 'saldo'],
    text: 'Consultá la sección Mis facturas desde tu cuenta. Este asistente no conoce tu saldo ni confirma pagos. Si una factura ofrece un enlace de pago, revisá la información que muestra el sistema antes de continuar.',
    link: { to: '/facturas', label: 'Ir a Facturas', personal: true }
  },
  {
    id: 'documentos', label: 'Presentar documentación',
    keywords: ['documento', 'documentos', 'documentacion', 'dni', 'alta', 'registro', 'registrarme'],
    text: 'Para completar el alta de socio, revisá el trámite y los documentos solicitados en tu cuenta. La documentación pasa por revisión. Si recibís un rechazo, consultá el motivo antes de volver a presentarla.',
    link: { to: '/socio/alta', label: 'Consultar mi alta', personal: true }
  },
  {
    id: 'acceso', label: 'Recuperar mi acceso',
    keywords: ['contrasena', 'clave', 'login', 'sesion', 'acceso', 'entrar', 'ingresar', 'recuperar'],
    text: 'En Iniciar sesión elegí el tipo de cuenta e ingresá tus datos. Si olvidaste la contraseña, usá la opción de recuperación. No compartas contraseñas ni códigos en este chat.',
    link: { to: '/recuperar-contrasena', label: 'Recuperar contraseña' }
  },
  {
    id: 'mediciones', label: 'Ver mis mediciones',
    keywords: ['medicion', 'mediciones', 'medidor', 'medidores', 'consumo', 'consumos', 'lectura', 'lecturas'],
    text: 'Como socio, podés consultar las lecturas disponibles en Mis mediciones. Este chat no carga lecturas ni consulta los datos de tu medidor. Si detectás una diferencia, registrá un reclamo para que sea revisado.',
    link: { to: '/socio/mis-mediciones', label: 'Ir a Mis mediciones', personal: true }
  },
  {
    id: 'perfil', label: 'Actualizar mi perfil',
    keywords: ['perfil', 'actualizar', 'actualizo', 'cambiar', 'cambio', 'modificar', 'telefono', 'correo', 'email', 'datos'],
    requires: [['perfil', 'datos', 'telefono', 'correo', 'email'], ['perfil', 'actualizar', 'actualizo', 'cambiar', 'cambio', 'modificar', 'editar']],
    text: 'Ingresá como socio y abrí Mi perfil. En los datos de contacto podés actualizar tu teléfono y correo electrónico y guardar los cambios. No escribas esos datos en este chat: completalos en el formulario de tu cuenta.',
    link: { to: '/socio/perfil', label: 'Abrir Mi perfil', personal: true }
  },
  {
    id: 'documentos-rechazados', label: 'Documentación rechazada',
    keywords: ['documentacion', 'documento', 'documentos', 'alta', 'rechazaron', 'rechazada', 'rechazado', 'rechazo', 'motivo'],
    requires: [['documentacion', 'documento', 'documentos', 'alta'], ['rechazaron', 'rechazada', 'rechazado', 'rechazo']],
    text: 'Revisá el motivo informado en tu trámite de alta o en Mi documentación. Corregí lo solicitado y volvé a presentar los archivos desde la sección correspondiente. Este asistente no puede ver el motivo particular de tu cuenta ni aprobar documentos.',
    link: { to: '/socio/documentos', label: 'Ver Mi documentación', personal: true }
  },
  {
    id: 'estado-solicitud', label: 'Estado de mi solicitud',
    keywords: ['solicitud', 'solicitudes', 'servicio', 'aprobaron', 'aprobada', 'aprobar', 'aprobacion', 'estado', 'avance', 'seguimiento'],
    requires: [['solicitud', 'solicitudes', 'servicio'], ['aprobaron', 'aprobada', 'aprobar', 'aprobacion', 'estado', 'avance', 'seguimiento']],
    text: 'Abrí Solicitudes de servicio para consultar el estado y las observaciones disponibles. Una solicitud en revisión espera evaluación; si figura pendiente de instalación, debe continuar la etapa técnica. El chat no confirma si tu solicitud particular fue aprobada.',
    link: { to: '/socio/solicitudes-servicio', label: 'Consultar mis solicitudes', personal: true }
  },
  {
    id: 'consultar-cancelar-turno', label: 'Consultar o cancelar un turno',
    keywords: ['turno', 'turnos', 'cancelar', 'cancelo', 'anular', 'consultar', 'consulto', 'ver', 'propuesta', 'horario'],
    requires: [['turno', 'turnos', 'cita'], ['cancelar', 'cancelo', 'anular', 'consultar', 'consulto', 'ver', 'propuesta']],
    text: 'En Mis turnos podés consultar fecha, horario y estado. Abrí el detalle y usá Cancelar si esa acción está habilitada; el turno permanece en el historial. Si recibiste una propuesta de otro horario, revisala antes de aceptarla. El chat no modifica turnos.',
    link: { to: '/socio/turnos', label: 'Consultar Mis turnos', personal: true }
  },
  {
    id: 'seguimiento-reclamo', label: 'Seguimiento de mi reclamo',
    keywords: ['reclamo', 'reclamos', 'seguimiento', 'avance', 'estado', 'ver', 'consultar', 'resolvieron', 'resuelto'],
    requires: [['reclamo', 'reclamos'], ['seguimiento', 'avance', 'estado', 'ver', 'consultar', 'resolvieron', 'resuelto']],
    text: 'Entrá en Mis reclamos y abrí el detalle del reclamo que querés consultar. Allí podés revisar su estado y el seguimiento disponible. Para saber si tu caso fue resuelto, consultá ese registro: este chat no accede a los reclamos personales.',
    link: { to: '/socio/reclamos', label: 'Abrir Mis reclamos', personal: true }
  },
  {
    id: 'consumo-incorrecto', label: 'Mi consumo parece incorrecto',
    keywords: ['consumo', 'consumos', 'lectura', 'medicion', 'incorrecto', 'incorrecta', 'diferencia', 'error', 'alto', 'elevado', 'excesivo'],
    requires: [['consumo', 'consumos', 'lectura', 'medicion'], ['incorrecto', 'incorrecta', 'diferencia', 'error', 'alto', 'elevado', 'excesivo']],
    text: 'Revisá el período y las lecturas disponibles en Mis mediciones. Si detectás una diferencia, registrá un reclamo indicando el servicio y el período para que la cooperativa lo revise. El asistente no calcula ajustes ni determina el motivo de un consumo elevado.',
    link: { to: '/socio/mis-mediciones', label: 'Revisar Mis mediciones', personal: true }
  },
  {
    id: 'ubicacion', label: 'Ubicación de la cooperativa',
    keywords: ['ubicacion', 'direccion', 'sede', 'oficina', 'queda', 'llegar', 'domicilio', 'cooperativa'],
    requires: [['ubicacion', 'direccion', 'sede', 'oficina', 'queda', 'llegar', 'domicilio']],
    text: 'La sede administrativa está en Mitre 587, Rancul, La Pampa, Argentina. Atiende de lunes a viernes de 06:30 a 12:30. En el inicio del portal encontrás la ubicación y el enlace Cómo llegar.',
    link: { to: '/', label: 'Ver ubicación en el inicio' }
  },
  {
    id: 'horarios', label: 'Horarios de atención',
    keywords: ['horario', 'horarios', 'atiende', 'atienden', 'abren', 'abre', 'cierran', 'cierra', 'atencion'],
    requires: [['horario', 'horarios', 'atiende', 'atienden', 'abren', 'abre', 'cierran', 'cierra']],
    text: 'Sede administrativa: lunes a viernes de 06:30 a 12:30. Internet: turno mañana de 06:30 a 13:30 y turno tarde de 15:30 a 20:30. Son los horarios publicados en el portal; para feriados o cambios excepcionales, confirmá con la cooperativa.',
    link: { to: '/#atencion', label: 'Ver atención y guardias' }
  },
  {
    id: 'contactos-guardias', label: 'Contactos y guardias',
    keywords: ['contacto', 'contactos', 'guardia', 'guardias', 'telefono', 'telefonos', 'numero', 'llamar', 'llamo', 'corte', 'cortes', 'corta', 'corto', 'emergencia', 'urgencia'],
    requires: [['contacto', 'contactos', 'guardia', 'guardias', 'telefono', 'telefonos', 'numero', 'llamar', 'llamo', 'corte', 'cortes', 'corta', 'corto', 'emergencia', 'urgencia']],
    text: 'Contactos publicados por servicio:\n• Administración: 2302 412698.\n• Agua potable: 2302 690326.\n• Energía eléctrica: 2302 606821.\n• Internet, mañana: 2302 609000; tarde: 2302 400698.\n• Sepelio (tercerizado): 2302 600649.\nLa cooperativa informa guardia pasiva permanente. Fuera de horario recibe reclamos; en situaciones excepcionales la atención o reparación puede postergarse. Ante un corte, contactá al servicio correspondiente. Este chat no despacha asistencia.',
    link: { to: '/#atencion', label: 'Ver contactos en el inicio' }
  },
  {
    id: 'en-revision', label: '¿Qué significa en revisión?',
    keywords: ['revision', 'revisando', 'significa', 'tramite', 'pendiente', 'evaluacion'],
    requires: [['revision', 'revisando']],
    text: 'En revisión significa que el trámite o resultado presentado está pendiente de evaluación por el responsable correspondiente. No equivale a una aprobación ni a un rechazo. Consultá las observaciones y el estado en la sección donde lo presentaste; el chat no puede indicar un plazo de resolución.',
    link: { to: '/ayuda', label: 'Abrir Centro de ayuda' }
  },
  {
    id: 'seguimiento-tramites', label: 'Seguimiento de trámites',
    keywords: ['tramite', 'tramites', 'seguimiento', 'avance', 'estado', 'estados'],
    requires: [['tramite', 'tramites', 'seguimiento', 'avance', 'estado', 'estados']],
    text: 'Cada trámite tiene su sección: el alta se consulta en Mi alta; las solicitudes en Solicitudes de servicio; los reclamos en Mis reclamos; y los turnos en Mis turnos. Indicame qué trámite querés consultar y te muestro cómo llegar. El asistente no conoce el estado particular de tu cuenta.',
    link: { to: '/socio', label: 'Ir a mi panel de socio', personal: true }
  }
]

function words(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) || []
}

export function getChatReply(question) {
  const tokens = new Set(words(question))
  if (!tokens.size) return null
  const normalized = [...words(question)].join(' ')
  const selected = CHAT_TOPICS.find(topic => words(topic.label).join(' ') === normalized)
  if (selected) return selected
  const ranked = CHAT_TOPICS.map(topic => {
    const eligible = !topic.requires || topic.requires.every(group => group.some(word => tokens.has(word)))
    const matches = topic.keywords.filter(word => tokens.has(word)).length
    return { topic, score: eligible && matches ? matches + (topic.requires ? 10 : 0) : 0 }
  })
    .sort((a, b) => b.score - a.score)
  if (ranked[0].score) return ranked[0].topic
  if (['hola', 'buenas', 'buenos', 'gracias'].some(word => tokens.has(word))) {
    return { text: '¡Hola! Soy el asistente de ayuda de SocioAPP Rancul. Puedo orientarte sobre trámites, perfil, turnos, reclamos, servicios, facturas, documentación, contactos y horarios. Elegí un tema o escribí tu consulta.' }
  }
  return { text: 'No encontré una respuesta para esa consulta. Podés preguntar por turnos, reclamos, servicios, facturas, documentación, perfil, seguimiento, contactos, guardias u horarios. Para otras consultas, abrí el Centro de ayuda.', link: { to: '/ayuda', label: 'Abrir Centro de ayuda' } }
}

export function getChatLink(link, role) {
  if (!link?.personal || role === 'Socio') return link
  if (!role) return { to: '/login', label: 'Iniciar sesión como socio', state: { from: { pathname: link.to } } }
  return { to: '/ayuda', label: 'Abrir Centro de ayuda' }
}
