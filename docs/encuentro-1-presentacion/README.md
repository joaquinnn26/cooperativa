# Encuentro 1 - Presentacion del proyecto

## Objetivo del encuentro

Responder la pregunta eje: **Como vamos a trabajar?**

En este encuentro no alcanza con mostrar pantallas sueltas. El equipo tiene que explicar el proyecto, el sistema base, las tecnologias elegidas y la organizacion inicial del trabajo.

## Resumen para exponer

El proyecto es un **portal web para una cooperativa de agua y luz**. El sistema busca digitalizar operaciones frecuentes de la cooperativa y separar la experiencia segun el tipo de usuario:

- **Socio:** consulta servicios, facturas, mediciones, reclamos, solicitudes de servicio y turnos.
- **Administrador:** gestiona socios, empleados, servicios, facturas, pagos, anuncios, reclamos, lecturas, medidores, rutas de medicion, solicitudes de servicio y turnos.
- **Empleado:** accede a tareas operativas como mediciones, hoja de ruta y solicitudes tecnicas.

La idea central es que la cooperativa pueda organizar informacion, atencion y procesos operativos desde un unico portal.

## Sistema base actual

El frontend ya tiene una SPA en React con rutas publicas y privadas.

Rutas publicas:

- `/`: pagina principal del portal.
- `/login`: inicio de sesion.
- `/register`: registro de socios.
- `/ayuda`, `/servicios`, `/contacto`, `/terminos`: paginas informativas.

Rutas de socio:

- `/socio`: panel principal.
- `/socio/reclamos` y `/socio/reclamos/nuevo`.
- `/socio/solicitudes-servicio` y `/socio/solicitudes-servicio/nueva`.
- `/socio/mis-servicios`.
- `/socio/mis-mediciones`.
- `/socio/facturas`.
- `/socio/perfil`.
- `/socio/turnos`.

Rutas de administrador:

- `/admin`: panel principal.
- `/admin/socios`.
- `/admin/empleados`.
- `/admin/facturas`.
- `/admin/servicios`.
- `/admin/pagos`.
- `/admin/anuncios`.
- `/admin/reclamos`.
- `/admin/reportes`.
- `/admin/lecturas`.
- `/admin/rutas-medicion`.
- `/admin/solicitudes-servicio`.
- `/admin/requisitos-servicio`.
- `/admin/medidores`.
- `/admin/turnos`.

Rutas de empleado:

- `/empleado`: panel principal.
- `/empleado/mediciones`.
- `/empleado/hoja-ruta`.
- `/empleado/solicitudes-tecnicas`.

### Permisos por cargo de empleado

El sistema mantiene tres roles principales: **Administrador**, **Socio** y **Empleado**. Dentro del rol **Empleado**, el acceso se define por el cargo asignado. Esto evita crear muchos roles distintos y permite que la cooperativa cambie responsabilidades sin modificar toda la autenticacion.

| Cargo | Vistas principales | Permisos funcionales |
| --- | --- | --- |
| Atencion al Cliente | `/empleado`, `/empleado/turnos`, `/empleado/reclamos`, `/empleado/solicitudes-servicio` | Consultar socios, registrar reclamos recibidos en oficina, revisar solicitudes de servicio, gestionar turnos de atencion y derivar casos a otros sectores. |
| Lecturista | `/empleado`, `/empleado/hoja-ruta`, `/empleado/mediciones` | Ver hojas de ruta asignadas, iniciar recorrido, cargar lecturas de medidores, registrar incidencias de medicion y finalizar la ruta con firma. |
| Tecnico | `/empleado`, `/empleado/solicitudes-tecnicas`, `/empleado/instalaciones` | Ver solicitudes aprobadas que requieren instalacion o revision tecnica, consultar direccion y datos del socio, registrar avance tecnico y marcar trabajos realizados. |
| Supervisor | `/empleado`, `/empleado/supervision`, `/empleado/rutas-medicion`, `/empleado/reclamos`, `/empleado/solicitudes-servicio` | Supervisar trabajo de lecturistas y tecnicos, controlar rutas, revisar reclamos operativos, reasignar tareas y validar estados antes del cierre. |
| Cobrador | `/empleado`, `/empleado/cobranzas`, `/empleado/facturas`, `/empleado/pagos` | Consultar facturas, registrar pagos presenciales, controlar deuda de socios, emitir comprobantes y ver historial de cobranzas. |
| Operador | `/empleado`, `/empleado/operaciones`, `/empleado/servicios`, `/empleado/medidores` | Consultar servicios activos, controlar altas o bajas operativas, revisar medidores instalados y asistir en tareas internas del servicio. |
| Secretario | `/empleado`, `/empleado/turnos`, `/empleado/anuncios`, `/empleado/documentacion` | Organizar turnos, cargar comunicados, gestionar documentacion administrativa y asistir en la atencion interna de la cooperativa. |
| Gerente | `/empleado`, `/empleado/reportes`, `/empleado/supervision`, `/empleado/indicadores` | Ver indicadores generales, consultar reportes operativos, controlar rendimiento de sectores y tomar decisiones de gestion. |
| Soporte Tecnico | `/empleado`, `/empleado/soporte`, `/empleado/incidencias`, `/empleado/usuarios` | Atender problemas tecnicos del sistema, revisar incidencias internas, asistir usuarios y reportar fallas al equipo de desarrollo. |

Vistas ya implementadas o avanzadas:

- `/empleado`: panel principal del empleado.
- `/empleado/hoja-ruta`: trabajo del cargo Lecturista.
- `/empleado/mediciones`: carga de mediciones del cargo Lecturista.
- `/empleado/solicitudes-tecnicas`: trabajo del cargo Tecnico.

Vistas planificadas:

- `/empleado/turnos`.
- `/empleado/reclamos`.
- `/empleado/cobranzas`.
- `/empleado/facturas`.
- `/empleado/instalaciones`.
- `/empleado/supervision`.
- `/empleado/reportes`.
- `/empleado/soporte`.

## Tecnologias elegidas y justificacion

| Tecnologia | Uso en el proyecto | Justificacion |
| --- | --- | --- |
| React 18 | Construccion de la interfaz | Permite dividir el portal en componentes reutilizables y manejar pantallas dinamicas. |
| Vite | Entorno de desarrollo y build | Arranque rapido, configuracion simple y buen soporte para React. |
| React Router DOM | Navegacion | Permite separar rutas publicas, rutas de socio, administrador y empleado. |
| Zustand | Estado global | Se usa para sesion, datos de cooperativa y flujos compartidos sin una estructura pesada. |
| Tailwind CSS | Estilos | Facilita una interfaz consistente con clases utilitarias. |
| Lucide React | Iconos | Aporta iconografia clara para acciones y modulos. |
| SweetAlert2 | Alertas y confirmaciones | Mejora la comunicacion de errores, confirmaciones y resultados de acciones. |
| Recharts | Graficos | Util para visualizar consumos, mediciones o indicadores. |
| jsPDF, jspdf-autotable, xlsx | Exportaciones | Permiten generar reportes o salidas exportables para el usuario. |
| API REST configurable | Integracion backend | El frontend consume una API en `VITE_API_SERVER_URL` con base `/api`. |

## Sprint 0

### Proposito

Ordenar el equipo, definir roles, reconocer el sistema base, elegir herramientas y dejar armado el primer backlog del proyecto.

### Equipo y roles

Completar con nombres reales antes de presentar:

| Rol | Responsable | Que defiende en clase |
| --- | --- | --- |
| FN - Funcional/Negocio | Completar | Explica que problema resuelve el sistema para la cooperativa y que procesos del negocio se priorizan. |
| DEV - Desarrollo | Completar | Explica tecnologias, arquitectura base, rutas, integracion con API y estado actual del sistema. |
| SM / PO - Gestion | Completar | Explica organizacion del Sprint 0, herramienta de seguimiento, backlog inicial y criterios de priorizacion. |

## Backlog inicial

| Prioridad | Historia de usuario | Rol beneficiado | Criterio de aceptacion inicial |
| --- | --- | --- | --- |
| Alta | Como socio quiero iniciar sesion para acceder a mis tramites y datos. | Socio | El sistema valida credenciales y redirige segun rol. |
| Alta | Como administrador quiero gestionar socios para mantener actualizado el padron. | Administrador | Se puede listar, crear, editar, desactivar o eliminar socios segun reglas definidas. |
| Alta | Como socio quiero consultar mis servicios para ver que servicios tengo asociados. | Socio | El socio ve sus servicios de agua/luz asociados. |
| Alta | Como socio quiero realizar reclamos para informar problemas del servicio. | Socio | El reclamo queda registrado y puede ser consultado. |
| Alta | Como administrador quiero gestionar reclamos para dar seguimiento a los problemas reportados. | Administrador | El administrador puede ver reclamos y cambiar su estado. |
| Media | Como socio quiero solicitar un nuevo servicio para iniciar el alta de agua o luz. | Socio | El socio puede cargar una solicitud con datos requeridos. |
| Media | Como administrador quiero revisar solicitudes de servicio para aprobar o rechazar altas. | Administrador | El administrador ve solicitudes pendientes y puede avanzar su estado. |
| Media | Como empleado quiero ver una hoja de ruta de medicion para registrar lecturas asignadas. | Empleado | El empleado ve rutas asignadas y puede trabajar sobre mediciones. |
| Media | Como socio quiero reservar turnos para atencion administrativa. | Socio | El socio puede solicitar un turno disponible. |
| Baja | Como administrador quiero obtener reportes para analizar el estado operativo de la cooperativa. | Administrador | El sistema genera salidas exportables o informes basicos. |

## Herramienta de gestion

Definir y mostrar una herramienta concreta. Opciones validas:

- Trello.
- GitHub Projects.
- Jira.
- Notion.
- Planilla compartida.

Para el Encuentro 1 conviene mostrar al menos estas columnas:

- Backlog.
- Sprint 0.
- En progreso.
- Hecho.
- Bloqueado.

## Guion breve de defensa

### FN

> El sistema esta pensado para una cooperativa de agua y luz. Los actores principales son socio, administrador y empleado. El socio necesita resolver tramites y consultar informacion sin depender siempre de la atencion presencial. El administrador necesita controlar datos, reclamos, solicitudes, pagos, turnos y reportes. El empleado necesita herramientas operativas, por ejemplo para mediciones y hojas de ruta.

### DEV

> La base tecnica es una SPA hecha con React, Vite y Tailwind. La navegacion esta organizada con React Router y protegida por roles. El estado de sesion y los datos compartidos se manejan con Zustand. La API se consume desde una URL configurable, por defecto `http://localhost:58234/api`. El sistema ya diferencia pantallas publicas, pantallas de socio, administrador y empleado.

### SM / PO

> En Sprint 0 organizamos roles, definimos el alcance inicial y armamos un backlog priorizado. La prioridad esta puesta en autenticacion, gestion de socios, servicios, reclamos y solicitudes porque son procesos centrales para validar el sistema con el negocio. Vamos a registrar tareas, avances, bloqueos y decisiones en la herramienta de gestion elegida.

## Que mostrar en vivo

1. Abrir la pagina principal y explicar que es el portal de la cooperativa.
2. Mostrar login/registro como entrada al sistema.
3. Mostrar que existen rutas separadas para socio, administrador y empleado.
4. Mostrar el archivo `src/App.jsx` para evidenciar la separacion por roles.
5. Mostrar `src/config/api.js` para explicar que el frontend consume una API configurable.
6. Mostrar la herramienta de gestion con Sprint 0 y backlog inicial.

## Riesgos para este encuentro

- No llevar nombres asignados a los roles.
- No tener una herramienta de gestion visible.
- Hablar solo de tecnologia y no del problema real de la cooperativa.
- Mostrar muchas pantallas sin explicar que proceso del negocio representa cada una.
- No distinguir entre lo que ya esta hecho y lo que queda planificado.

## Checklist antes de presentar

- [ ] Completar nombres reales del equipo y roles.
- [ ] Elegir herramienta de gestion.
- [ ] Crear tablero con columnas minimas.
- [ ] Cargar backlog inicial en la herramienta.
- [ ] Preparar una demo corta del portal.
- [ ] Preparar credenciales de prueba para cada rol, si la API esta disponible.
- [ ] Acordar que responde cada integrante.
