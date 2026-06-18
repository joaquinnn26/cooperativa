# 1. Inventario y alcance funcional

## Roles identificados

| Rol | Capacidades observadas |
| --- | --- |
| Visitante | Inicio, servicios, ayuda, login, registro y anuncios publicos |
| Socio | Facturas, perfil, servicios, mediciones, solicitudes, reclamos y turnos |
| Empleado | Panel laboral; funciones segun cargo |
| Lecturista | Hoja de ruta, carga de lecturas, incidencias y firma final |
| Tecnico | Consulta de solicitudes tecnicas activas |
| Administrador | Gestion integral de personas, servicios, facturas, anuncios, reclamos, turnos, medidores, lecturas, rutas y solicitudes |

## Modulos auditados

| Modulo | Frontend | API | Persistencia | Estado |
| --- | --- | --- | --- | --- |
| Autenticacion | Login y sesion persistida | `api/auth/login` | UsuarioSistema, Rol | Parcial |
| Socios | Alta, edicion, listado, suspension | `api/socio` | Socio, Persona | Verificado |
| Empleados | Alta desde socio, listado, suspension | `api/empleado` | Empleado, Cargo | Verificado |
| Servicios | ABM y asignacion | `api/servicio`, `api/serviciosocio` | Servicio, ServicioSocio | Verificado |
| Solicitudes | Alta, documentos, revision, aprobacion/rechazo | `api/solicitudservicio` | SolicitudServicio, DocumentoSolicitud, HistorialEstadoSolicitud | Parcial |
| Medidores | Alta, edicion, activacion y baja | `api/medidor` | Medidor, TipoMedidor | Verificado |
| Mediciones | Lecturas e historial | `api/medicion` | Medicion, TipoLectura | Verificado |
| Rutas | Creacion, asignacion, ejecucion, incidencias y firma | `api/rutas-medicion` | RutaMedicion, RutaMedicionDetalle | Verificado |
| Facturas | Emision, edicion, pago y baja logica | `api/factura` | Factura | Verificado |
| Pagos | Vista con datos locales | Sin API propia | Sin tabla propia auditada | Incompleto |
| Reclamos | Alta, listado, cambio de estado y baja logica | `api/reclamo` | Reclamo, EstadoReclamo, TipoReclamo | Parcial |
| Turnos | Disponibilidad, solicitud, propuesta, aprobacion y cancelacion | `api/turnos`, `api/admin/turnos` | Turnos, EstadoTurno | Verificado |
| Anuncios | ABM, vigencia, prioridad y aviso publico fijo | `api/anuncios` | Anuncio, PrioridadAnuncio | Verificado |
| Dashboard | KPI y graficos con datos de BD | `api/admin/dashboard/metricas` | Consultas agregadas | Verificado |
| Reportes | Pantalla placeholder | Sin API de reportes | Sin persistencia especifica | Incompleto |
| Recuperar clave | Formulario | Sin endpoint | No implementado | Incompleto |
| Cambiar clave | Formulario de perfil | Sin endpoint | No implementado | Incompleto |

## Catalogos reales consultados

### Solicitudes

1. Pendiente
2. En Revision
3. Aprobada
4. Rechazada
5. Cancelada

### Reclamos

1. Pendiente
2. En Proceso
3. Resuelto
4. Cancelado

### Turnos

1. Pendiente
2. Aprobado
3. Propuesto
4. Rechazado
5. Cancelado
6. Aceptado

### Prioridad de anuncios

1. Alta
2. Media
3. Baja

## Entidades con estado binario

- Socio: activo / inactivo.
- Empleado: activo / inactivo.
- Medidor: activo / inactivo.
- ServicioSocio: activo / inactivo.
- RequisitoServicio: activo / inactivo.
- Factura: activa / dada de baja.
- Anuncio: activo / inactivo.
- PrioridadAnuncio: activa / inactiva.

## Entidades con estado calculado

La factura no guarda un texto de estado. La API lo calcula:

- `Pagada` cuando `Pagada = true`.
- `Vencida` cuando no esta pagada y la fecha de caducidad ya paso.
- `Pendiente` cuando no esta pagada y no vencio.

## Fuentes principales revisadas

- `src/App.jsx`
- `src/components/Layout.jsx`
- `src/store/cooperativeStore.js`
- `src/store/serviceWorkflowStore.js`
- `src/utils/validation.js`
- Paginas de `features/admin`, `features/socio`, `features/empleado` y `features/auth`
- Controladores de `CooperativaAPI/Controllers`
- Entidades generadas por Entity Framework
- `Data/AppDbContext.cs`
- Catalogos reales de SQL Server

