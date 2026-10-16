# Asistente de ayuda de SocioAPP Rancul

Primera versión de un chatbot con respuestas predefinidas, ejecutado en el navegador.
No utiliza inteligencia artificial ni una API externa. Orienta sobre las pantallas
del portal; no consulta cuentas, registra trámites ni confirma pagos.

## Archivos

- `src/components/HelpChatbot.jsx`: botón flotante, conversación y controles accesibles.
- `src/utils/chatbot.js`: temas, palabras clave, respuestas y enlaces.
- `src/components/Layout.jsx`: integración y reinicio al cambiar de cuenta o rol.
- `tests/chatbot.test.js`: reconocimiento de temas y destinos según el perfil.

## Cómo editar las respuestas

Agregar o modificar una entrada de `CHAT_TOPICS`: `id`, `label`, `keywords`,
`text` y `link`. Las palabras clave se comparan por palabra completa, sin tildes
y sin distinguir mayúsculas. El campo opcional `requires` define grupos de palabras:
debe coincidir al menos una palabra de cada grupo para habilitar ese tema específico.
Se priorizan esos temas sobre los generales y después la cantidad de coincidencias.
Los botones usan la coincidencia exacta de su etiqueta. «Ver todas las consultas»
despliega el catálogo completo sin ocupar toda la conversación al abrir el chat.
Las consultas desconocidas ofrecen el Centro de ayuda.

Los enlaces personales dirigen al login cuando no hay sesión. Para otros perfiles
se ofrece el Centro de ayuda; las rutas protegidas conservan sus verificaciones.
La conversación sólo permanece en memoria, se limita a los últimos 40 mensajes
y se borra al reiniciar, recargar o cambiar de cuenta o rol.

## Verificación manual

1. Abrir el portal y seleccionar «¿Te ayudamos?».
2. Probar «Pedir un turno» y una pregunta escrita con tildes.
3. Verificar que una consulta desconocida ofrezca ayuda.
4. Sin sesión, comprobar que un enlace personal abra el login.
5. Reiniciar la conversación y cerrar con Escape.
6. Comprobar el panel en escritorio y en una ventana pequeña.

Para ejecutar sólo las pruebas del asistente: `node --test tests/chatbot.test.js`.

## Consultas ampliadas

Se agregaron actualización del perfil, documentación rechazada, estado de solicitudes,
consulta y cancelación de turnos, seguimiento de reclamos, consumos incorrectos,
ubicación, horarios, contactos y guardias, significado de «en revisión» y seguimiento
general de trámites. Los datos de atención reproducen los publicados en
`src/features/home/Home.jsx`; al cambiarlos en el portal, actualizar también este catálogo.
Las respuestas personales indican dónde consultar el dato, sin inventar estados,
plazos, saldos ni motivos particulares del socio.
