# Etapa 1: zonas y barrios de Rancul

Actualización 28/09/2026: las respuestas reales confirmaron organización por ruta/folio y cobertura rural. El barrio pasó a ser opcional y se agregaron localidad, ámbito, ruta y folio. Consultar `actualizacion-cuestionario-etapas-1-2.md` para el estado vigente; el contenido siguiente documenta la entrega inicial del 20/09.

Estado al 20/09/2026: interfaz y API implementadas. Migración aplicada sobre la base Cooperativa después de generar y verificar un respaldo. Pendientes la activación mediante recompilación habitual de la API y la comprobación visual del circuito autenticado.

## Hallazgos del proyecto

- Frontend: React, Vite, Tailwind, React Router y Zustand. Las rutas administrativas están protegidas en `src/App.jsx`; los permisos laborales se describen en `src/utils/employeePermissions.js`.
- La conexión a la API se configura en `src/config/api.js`; los requests existentes envían un token Bearer.
- `src/store/serviceWorkflowStore.js` consume servicios asociados, solicitudes e instalaciones. La dirección admite diferentes fuentes; debe verificarse cuál es persistente en la API vigente antes de migrar ubicaciones.
- `src/features/admin/pages/AdminMedidores.jsx` utiliza `idServicioSocio` para relacionar instalaciones y medidores.
- `backend-snippets` contiene fragmentos de Entity Framework, no un proyecto compilable completo.
- API vigente confirmada por el usuario: `C:\Users\pc\Desktop\facultad\CooperativaAPIv2\CooperativaAPI\CooperativaAPI`. Las copias vecinas al frontend son anteriores y no se modificaron. En la API vigente el controlador de servicios conserva los identificadores.

## Modelo implementado

- Zona: identificador estable, nombre, estado activo y control de concurrencia.
- Barrio: identificador estable, nombre, zona y estado activo. Un barrio pertenece a una zona actual; una zona agrupa varios barrios.
- UbicacionServicio: relación uno a uno con ServicioSocio, con dirección, barrio y versión de concurrencia. Las conexiones sin fila de ubicación permanecen pendientes. La zona actual se obtiene del barrio, evitando duplicar una relación que pueda contradecirse.
- Historial territorial: conservar cambios de barrio de una conexión y de zona de un barrio, con fecha y responsable. Los nombres anteriores también deben poder consultarse.
- Auditoría: registrar actor autenticado, acción, entidad, identificador, fecha UTC, cambios y motivo cuando corresponda. La identidad se obtiene en el servidor, nunca del cuerpo enviado por el navegador.

Se agregaron Zona, Barrio, UbicacionServicio e HistorialTerritorial. No se modificaron entidades generadas por EDMX: el controlador usa consultas SQL parametrizadas mediante la conexión existente de Entity Framework. No se inventaron barrios, zonas, domicilios ni asociaciones. Los nombres de zona y barrio son únicos dentro de Rancul, sin distinguir mayúsculas ni tildes.

## Reglas

1. Normalizar espacios y controlar nombres duplicados sin distinguir mayúsculas; confirmar el alcance territorial de unicidad al revisar el esquema.
2. Desactivar en lugar de eliminar. Mantener visibles las referencias históricas a entidades inactivas.
3. Impedir nuevas asignaciones a barrios o zonas inactivos.
4. Impedir desactivar una zona con barrios activos y un barrio con conexiones activas hasta resolver sus asociaciones; explicar el conflicto al usuario.
5. Permitir registros existentes sin barrio, identificados como pendientes de completar. No inferirlo del domicilio personal del socio.
6. Guardar el cambio y su auditoría en la misma transacción. Proteger operaciones con permisos del servidor y detectar ediciones concurrentes.
7. Mantener identificadores de conexiones existentes y sus relaciones con medidores, facturas y lecturas.
8. Al incorporar hojas de ruta en una etapa posterior, conservar la ubicación territorial del momento de generación; no recalcular su historia con la configuración actual.

## Interfaz y API

- Gestión administrativa de zonas y barrios con búsqueda, estados, edición y desactivación.
- Consulta paginada de conexiones por zona y barrio, y filtro de ubicación pendiente.
- Asignación o corrección del barrio de una conexión identificada de forma inequívoca por servicio, socio y domicilio.
- Historial de cambios territoriales consultable por personal autorizado.
- Validaciones equivalentes en API e interfaz; estados de carga, error y reintento sin simular persistencia local.
- Usar inicialmente el rol administrador ya existente. La ampliación a cargos específicos requerirá la matriz de permisos correspondiente.
- Rutas: GET `api/territorio/catalogos`; POST y PUT `api/territorio/zonas` y `barrios`; GET `api/territorio/conexiones`; PUT `api/territorio/conexiones/{id}`; GET `api/territorio/historial`.
- Acceso desde Administración > Servicios > Zonas y barrios, ruta `/admin/territorio`.
- Toda escritura exige motivo. Las ediciones devuelven HTTP 409 si la versión enviada quedó desactualizada.

## Verificación de aceptación

- Crear una zona y un barrio con datos reales proporcionados por el operador; recargar y confirmar persistencia.
- Rechazar duplicados y asignaciones a entidades inactivas.
- Asociar una conexión sin cambiar otras conexiones del mismo socio.
- Consultar conexiones asignadas y pendientes, con filtros consistentes.
- Mover un barrio a otra zona conservando el cambio anterior y su responsable.
- Verificar que usuarios no autorizados no pueden modificar datos mediante llamadas directas a la API.
- Verificar que un fallo revierte tanto el cambio como su auditoría y que dos ediciones concurrentes no se sobrescriben silenciosamente.
- Ejecutar pruebas y compilación del frontend y backend; comprobar el flujo integrado antes de considerar terminada la etapa.

## Instalación y verificación realizadas

- Controlador agregado al proyecto C# y script SQL instalado en su carpeta Data. Respaldo de los archivos originales en `App_Data/TerritorioBackup-20260920140432` dentro de la API vigente.
- Respaldo de SQL Server verificado con CHECKSUM: `D:\Microsoft SQL Server\MSSQL16.MSSQLSERVER01\MSSQL\Backup\Cooperativa_Territorio_20260920_140640.bak`.
- Migración aditiva aplicada y ejecutada nuevamente para verificar su repetibilidad; no inserta catálogos ni altera registros existentes.
- Frontend: compilación Vite correcta y 21 pruebas aprobadas. En el entorno restringido se ejecutaron con `node --test --experimental-test-isolation=none tests/*.test.js` por limitaciones para crear subprocesos.
- API: compilación completa de las fuentes C# y recursos EDMX correcta con Roslyn; consultas reales de catálogos, conexiones, pendientes e historial y rechazo HTTP 401 de accesos anónimos verificados mediante servidor HTTP en memoria.
- El MSBuild disponible pertenece a SQL Server Management Studio y carece de `Roslyn/Microsoft.CSharp.Core.targets`; no se reemplazaron los binarios de la API que ejecuta Visual Studio. Recompilar/iniciar el proyecto en el entorno de desarrollo habitual para activar el controlador.
- No fue posible comprobar visualmente la pantalla: la herramienta del navegador falló al iniciar por falta de `sandboxPolicy`. Tampoco se realizó un circuito de escritura autenticado de extremo a extremo; debe verificarse antes de considerar cerrada la etapa.
- Material reproducible en `backend-snippets/territorio`: instalador, migración, respaldo y verificador de integración. El historial implementado cubre este módulo; otros módulos se integrarán en sus etapas.

Facturación, pagos, Mercado Pago y la nueva lógica de hojas de ruta quedan para etapas posteriores.
