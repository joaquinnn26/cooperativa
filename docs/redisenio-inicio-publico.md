# Rediseño del Inicio público de SocioApp

## Implementado

- `src/features/home/Home.jsx`: presentación institucional, seis servicios, contactos por servicio, guardia pasiva, dirección y enlace de Google Maps. Se retiraron las secciones repetitivas de gestiones y pasos.
- `src/features/home/Home.css`: estilos limitados a clases públicas; dos columnas en escritorio y secciones apiladas en móvil, focos visibles y adaptación a movimiento reducido.
- `src/features/home/PublicFooter.jsx`: footer compacto, logo existente, identificación institucional, año actual y derechos reservados.
- `src/components/Layout.jsx`: reutiliza el encabezado y las rutas existentes, muestra Inicio/Ayuda/login en las páginas públicas y permite al Inicio ocupar todo el ancho. El login mantiene su encabezado y fondo anteriores. Los paneles privados conservan su presentación.
- La compilación regenera `dist/`. Ya había modificaciones en esa carpeta, en Layout y en los archivos del login antes de este trabajo. No se descartaron los cambios preexistentes ni se editaron los archivos del login en esta tarea.

Se reutilizan React Router, Lucide, el logo institucional, la imagen panorámica local proporcionada anteriormente y la arquitectura existente. No se añadieron dependencias.

## Datos institucionales

- Sede: Mitre 587, Rancul, La Pampa, Argentina. Lunes a viernes, 06:30 a 12:30. Teléfono 2302 412698.
- Agua: 2302 690326. Electricidad: 2302 606821. Sin horarios inventados.
- Internet: 2302 609000 de 06:30 a 13:30; 2302 400698 de 15:30 a 20:30. No se atribuyeron días de atención no confirmados.
- Sepelio tercerizado: 2302 600649. Sin horario inventado.
- Guardia pasiva: texto proporcionado por el usuario, sin atribuir atención 24/7 a los teléfonos habituales.
- Maps: búsqueda por la dirección confirmada, sin claves ni API adicional. Se verificó el destino del enlace, no la exactitud de la ficha externa de Google.

## Anuncios: análisis y bloqueo

Frontend existente: `AdminAnuncios.jsx`, `cooperativeStore.js`, `PublicAnnouncementsBanner.jsx`.
Backend existente: `AnunciosController.cs`, `Anuncio.cs`, `AppDbContext.cs`; entidad mapeada a `Anuncio`.

Endpoints inspeccionados:

- `GET /api/anuncios`: acceso sin autenticación; filtra Activo, FechaInicio y FechaFin. Ordena por Fijo, prioridad y publicación.
- `GET /api/anuncios/admin`: consulta administrativa.
- `POST /api/anuncios`, `PUT /api/anuncios/{id}`, `DELETE /api/anuncios/{id}`: administración protegida para Administrador. DELETE desactiva el registro.

Campos existentes: idAnuncio, Titulo, Contenido, Prioridad (referencia a PrioridadAnuncio), FechaPublicacion, FechaInicio, FechaFin, Activo, Fijo, idEmpleado. No existe categoría por servicio, audiencia pública/interna ni estado borrador/publicado/cancelado en el contrato inspeccionado. No se atribuyeron permisos de publicación a empleados que el controlador no admite.

La función compartida fetchAnnouncements puede devolver anuncios locales de ejemplo ante errores; las consultas administrativas también actualizan el mismo almacenamiento persistido. El nuevo Inicio no utiliza esos datos ni monta el banner compartido. El resto del módulo no fue alterado.

Consulta real realizada a `GET http://localhost:58234/api/anuncios`: HTTP 400. El backend informa que no admite la palabra clave `laptop-n6fbp4h5\sqlexpress;initial catalog`, correspondiente a la cadena DefaultConnection. No se corrigió esa configuración.

**Novedades no está integrada ni terminada**: presenta un aviso de indisponibilidad. No se implementaron botones sin efecto, detalles ficticios ni un estado vacío que oculte el bloqueo. Listado de tres registros, expansión, detalle, estado vacío y errores de consulta quedan pendientes hasta contar con un origen público seguro.

## Propuesta pendiente de autorización

1. Revisar y corregir DefaultConnection en el backend, sin incorporar secretos al frontend.
2. Incorporar Audiencia (Interna/Publica) y Estado (Borrador/Publicado/Cancelado) al modelo y tabla Anuncio. Valores iniciales conservadores: Interna y Borrador; clasificar los registros existentes explícitamente.
3. Adaptar el mismo GET /api/anuncios para devolver únicamente Publica + Publicado + Activo + fechas vigentes, proyectando solo los campos públicos, sin idEmpleado ni datos privados.
4. Adaptar la administración existente para seleccionar audiencia/estado, respetando sus permisos actuales. No crear endpoints duplicados.
5. Reutilizar el servicio de consulta con un modo público estricto que propague errores y evite ejemplos, caché administrativa y autenticación innecesaria. Probar explícitamente registros internos, borradores, cancelados, futuros y vencidos.

Estos cambios no fueron ejecutados: necesitan autorización del usuario por afectar backend, base de datos y administración privada.

## Fotografía y contenido legal

La fotografía real se ve en el mensaje, pero no se encontró un archivo local accesible en la carpeta de adjuntos. Se solicitó su ruta. Ubicación usa temporalmente un contenedor institucional sin fotografía; no se sustituyó por una fachada ficticia ni se editó la imagen adjunta.

La panorámica del hero es el recurso local del login previamente proporcionado. No se presenta como fotografía verificada de Rancul ni se usa la maqueta como fuente de datos.

La ruta /terminos existe, pero contiene “Contenido legal pendiente”. No existe ruta de privacidad identificada. Se omiten ambos enlaces y redes sociales no verificadas. Ayuda conserva su contenido, incluidos datos de ejemplo y páginas incompletas preexistentes; corregirlos queda fuera de esta tarea.

## Verificaciones

- `npm.cmd run build`: correcto.
- `npm.cmd test`: 27 pruebas correctas, ninguna fallida.
- Navegador: 1536×1024, 1366×768, 768×1024, 390×844 y 320×640; sin scroll horizontal, seis tarjetas y seis teléfonos presentes.
- Comprobados destinos del logo, Inicio, Ayuda y login; acceso a /ayuda y /login correcto.
- Login conserva email, password, remember y la imagen de fondo.
- Revisadas capturas de escritorio y móvil.
- Advertencias de compilación: datos antiguos de Browserslist y baseline-browser-mapping, preexistentes; no se actualizaron dependencias.
- No se probaron operaciones privadas autenticadas ni creación de anuncios: no se modificaron registros, permisos ni autenticación.
- No se realizaron commits, push, cambios de rama, merge, rebase, reset ni modificaciones de base de datos.

## Actualización posterior solicitada

El usuario indicó `src/assets/images/cospral-sede.jpg` y pidió mantener Novedades únicamente con estado vacío, sin integrar API ni modificar base de datos.

- Novedades muestra ahora “No hay novedades por el momento.”, sin consultas, ejemplos ni registros privados. Es un estado vacío intencional, no el resultado de una consulta a la API.
- Se preparó la carga local exacta de `cospral-sede.jpg` mediante Vite, sin requerir el archivo para compilar mientras está ausente.
- La fotografía, cuando esté presente, se renderiza sin filtros ni modificaciones, a ancho responsive y altura proporcional, sin recortarla.
- Al verificar esta instrucción, el archivo indicado aún no existía en el workspace; solo se encontró `login-background.png` en esa carpeta. Se solicitó confirmar dónde está guardado el original.
- No se modificaron backend, API, base de datos, login ni pantallas privadas.

## Integración real de Anuncio

La definición funcional confirmada por el usuario establece que Anuncio es comunicación general; no es necesario agregar Audiencia ni Estado. La propuesta anterior de nuevos campos queda descartada.

Se corrigió exclusivamente el prefijo faltante Data Source= de DefaultConnection en el Web.config local de la API, fuera del repositorio frontend. GET /api/anuncios pasó de HTTP 400 a HTTP 200 con []. No hubo nuevos errores de conexión. No se modificaron otros parámetros, estructura SQL, permisos ni el contrato de respuesta.

Archivos de esta integración:
- Home.jsx: monta PublicNews dentro del panel existente.
- PublicNews.jsx: consulta al cargar, tres anuncios en el orden de la API, fecha, resumen, detalle en diálogo nativo accesible, expansión a todos los vigentes, carga, vacío, error y reintento.
- publicAnnouncements.js: GET /api/anuncios sin credenciales, sin caché, sin fallback; conserva orden y proyecta solo campos de presentación.
- cooperativeStore.js: fetchAnnouncements reutiliza la consulta estricta, sin leer ni escribir anuncios administrativos persistidos. Las acciones administrativas permanecen intactas.
- Home.css: estilos de tarjetas y diálogo compatibles con el diseño existente.
- tests/publicAnnouncements.test.js: cuatro pruebas de orden, proyección, ausencia de fallback y respuestas inválidas/errores.
- dist/: regenerado mediante compilación.

Verificación real: GET público 200 []; GET /api/anuncios/admin sin token 401. Estado vacío comprobado en navegador contra la API real. Compilación correcta y 31 pruebas aprobadas.

Verificación con respuestas interceptadas SOLO en el navegador de pruebas (no se guardaron ejemplos en el producto ni en la base): carga, tres registros, orden, cuatro al expandir, contenido completo, cierre, error sin registros anteriores, reintento y ausencia de desbordamiento a 1536/768/390/320 px.

Límites: no se crearon registros reales para probar activos/inactivos/vencidos; el filtrado fue inspeccionado en el controlador pero no verificado con esos casos en SQL. No se probó el dashboard administrativo con una sesión autenticada ni se ejecutaron operaciones de publicación/edición/desactivación. Su controlador, componente y acciones del store no se editaron.

Contrato pendiente de consulta: MapAnuncio es compartido por lecturas y escrituras y sigue devolviendo idEmpleado. El frontend público lo descarta, pero eso no lo oculta de la respuesta HTTP. Reducir el DTO público sin alterar el administrativo requiere aprobación previa del usuario; no se realizó.
