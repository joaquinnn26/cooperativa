# 5. Sprint 4 documentado

## Nota de trazabilidad

Este sprint fue reconstruido desde el estado real del repositorio y las funcionalidades implementadas. El equipo debe completar nombres, fechas exactas y estimaciones originales.

## Objetivo del sprint

Fortalecer el sistema para uso real de la cooperativa, completando flujos operativos, validaciones, estados y visibilidad administrativa.

## Periodo

- Inicio: completar por el equipo.
- Cierre documental: 17 de junio de 2026.
- Duracion prevista: completar por el equipo.

## Incremento entregado

- Hoja de ruta de lecturistas con firma digital.
- Alta y gestion de rutas por administrador.
- Validaciones reutilizables en formularios.
- Correccion de login para empleados activos.
- Listados de socios y empleados incluyendo suspendidos.
- Tabla de empleados homologada a socios.
- Mejora de revision de solicitudes.
- Mejora de facturas con modal de alta.
- Anuncios persistidos, visibles antes y despues del login.
- Prioridades de anuncio normalizadas.
- Dashboard administrativo con metricas reales.

## Historias de usuario

| ID | Historia | Criterios de aceptacion | Estado |
| --- | --- | --- | --- |
| HU-401 | Como admin quiero crear rutas para lecturistas | Lecturista activo, medidores activos, sin duplicados, fecha y nombre validos | Hecha |
| HU-402 | Como lecturista quiero ejecutar mi hoja | Iniciar, cargar lectura/incidencia, ver progreso | Hecha |
| HU-403 | Como lecturista quiero firmar el cierre | Todos los detalles resueltos y firma valida | Hecha |
| HU-404 | Como admin quiero ver suspendidos | Listados incluyen activos e inactivos | Hecha |
| HU-405 | Como usuario quiero errores claros | Formularios validan y muestran causa | Parcial |
| HU-406 | Como admin quiero revisar solicitudes eficientemente | Filtros, resumen, detalle y acciones | Hecha |
| HU-407 | Como admin quiero crear factura en modal | Modal validado, recarga de listado | Hecha |
| HU-408 | Como admin quiero publicar cortes | Persistencia, prioridad, vigencia y aviso fijo | Hecha |
| HU-409 | Como socio quiero ver anuncios | Panel e inicio publico muestran vigentes | Hecha |
| HU-410 | Como admin quiero metricas reales | KPI consultados desde base de datos | Hecha |
| HU-411 | Como sistema quiero proteger endpoints por rol | JWT y rol validados en API | Pendiente |
| HU-412 | Como equipo quiero pruebas repetibles | Suite automatizada y evidencias | Pendiente |

## Definition of Done usada

Una historia se considera hecha cuando:

- El flujo principal funciona con API y base real.
- Existe validacion del formulario.
- La API rechaza los casos criticos.
- La pantalla informa exito o error.
- El build frontend y backend compila.
- No se borran datos ajenos.

Mejora necesaria para la proxima Definition of Done:

- Pruebas automatizadas obligatorias.
- Autorizacion backend obligatoria.
- Evidencia de caso feliz y casos borde.
- Aprobacion del cliente para reglas sensibles.

## Riesgos del sprint

- Modelo EDMX combinado con un `AppDbContext` adicional.
- Ausencia de migraciones automaticas.
- Endpoints sin autorizacion efectiva.
- Reglas duplicadas entre frontend y backend.
- Catalogos de estados con transiciones no centralizadas.
- Pagos y reportes todavia simulados/incompletos.

## Resultado de revision

El incremento cubre el trabajo operativo central, pero no debe considerarse listo para produccion masiva hasta cerrar seguridad backend, pruebas automatizadas, auditoria y reglas contables.

