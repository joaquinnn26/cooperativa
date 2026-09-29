# SocioApp: respuestas de la cooperativa y actualización de etapas 1 y 2

Fecha: 28/09/2026. API utilizada: `C:\Users\pc\Desktop\facultad\CooperativaAPIv2\CooperativaAPI\CooperativaAPI`, rama `feature/debora`.

## Fuentes y alcance

Se contrastaron `PREGUNTASCOOP-1 (2).docx` y `RESPUESTAS CUESTIONARIO 11-09-26.docx` con el texto de alcance adjunto. Las preguntas y ejemplos de opciones no se tomaron como respuestas. No se copiaron los datos personales del listado de empleados a la base.

La sección 14 (medidores) no tiene respuestas específicas. El usuario autorizó expresamente implementar también la propuesta de medidores. Por lo tanto, las reglas de esta etapa son decisiones de implementación revisables, no procedimientos ya confirmados por la cooperativa.

| Tema | Evidencia | Tratamiento |
|---|---|---|
| Recorridos por ruta y folio | Cobertura 2.3, 2.7; socios 5.3 y 5.7 | Campos y filtros propios de cada conexión; no se sustituyen por barrios. |
| Cobertura urbana y rural | Cobertura 2.2, 2.4 y 2.6 | Localidad/jurisdicción y ámbito explícitos. Barrio opcional. |
| Varias conexiones por socio y servicio | Socios 5.7–5.8; servicios 7.4 | Otra conexión no queda bloqueada porque el socio ya tenga el servicio. Cada solicitud finalizada crea una instancia independiente. |
| Número de socio oficial | Socios 5.3; listado pendiente en 5.15 | Campo nullable; no se copia el ID interno como número oficial. Importación/carga del padrón pendiente. |
| Medición manual de agua y energía | Consumo 8.4, 8.8–8.11 | Se conservan lecturas reales y no se agrega consumo estimado. |
| Reemplazo cuando no se obtiene lectura | Consumo 8.10 | Se prepara retiro/reinstalación, sin decidir automáticamente que cualquier intento fallido implica reemplazo. |
| Facturación y caja separadas | Áreas 3.6 | No se implementa cálculo tarifario ni integración con Holistor, pagos o archivos no definidos. |
| Estados físicos, revisión, reparación, reutilización y motivos | Propuesta del usuario; sección 14 pendiente | Implementados como propuesta autorizada, con motivos configurables sin catálogo ficticio. |
| Permisos específicos de medidores | Respuestas generales de cargos, pero sección 14 pendiente | Administrador gestiona altas, bajas definitivas y catálogo. Técnico registra operaciones y verifica identidad. Debe ratificarse la matriz final con la cooperativa. |

El documento de respuestas contiene una ambigüedad en usuarios 4.1 y deja sin reglamentar algunas intervenciones del empleado sobre sus propios servicios. No se resolvió inventando políticas. Usuarios personales/laborales, trámites, reclamos, turnos, pagos, bajas y WhatsApp quedan en sus etapas.

## Hallazgos y cambios

### Territorio y conexiones

- La etapa anterior exigía barrio desde API e interfaz, aunque SQL lo admitía nulo. Ahora una conexión rural se registra sin barrio con su referencia de ubicación, localidad y ámbito.
- `UbicacionServicio` incorpora `Localidad`, `Ambito`, `Ruta` y `Folio`. Ruta y folio son texto para preservar ceros iniciales; se cargan juntos o quedan ambos pendientes. No se inventaron localidades ni recorridos para los registros previos.
- Se mantiene el historial territorial anterior y se incluyen los nuevos campos en los siguientes movimientos. `Zona` y `Barrio` se conservan como clasificación opcional; no representan por sí mismos los recorridos oficiales.
- `Servicio` sigue siendo el catálogo general. Cada fila de `ServicioSocio` representa una contratación/conexión individual, identificada por `idServicioSocio`, con ubicación uno a uno en `UbicacionServicio`. El medidor es un activo independiente y su vínculo temporal está en `AsignacionMedidor`.
- `SolicitudConexion` guarda la relación inequívoca entre cada nueva solicitud finalizada y su conexión. No se reconstruyeron relaciones antiguas ambiguas por coincidencia de socio y servicio.
- La pantalla de solicitudes permite pedir otra conexión de un servicio ya activo. Por ahora continúa bloqueando una segunda solicitud pendiente del mismo servicio: el formulario existente no identifica todavía dos ubicaciones pendientes de forma inequívoca. Cambiar ese circuito documental requiere la etapa de solicitudes.
- La edición global de servicios no activa ni desactiva en bloque varias conexiones del mismo servicio. Si la selección no cambió, preserva los datos; si cambia con conexiones múltiples, rechaza la operación y exige un flujo individual posterior.
- No se impone unicidad global de ruta/folio: falta confirmar su alcance por localidad, servicio y recorrido. Tampoco se automatiza factibilidad por cobertura; las respuestas dicen que depende de la infraestructura.

### Medidores e historial

- `Medidor` conserva sus IDs y lecturas. Su `idServicioSocio` ahora admite nulo para equipos fuera de una conexión. Se actualizó `Medidor.cs` y la propiedad/multiplicidad en ambos esquemas del EDMX.
- `FichaMedidor` separa marca, modelo, verificación física, número anterior, condición física y versión para detectar ediciones concurrentes.
- `AsignacionMedidor` registra conexión, socio al momento de instalar, fechas y lecturas inicial/final. Índices y trigger impiden nuevas instalaciones superpuestas. Una conexión admite un medidor activo en este modelo; debe ratificarse cualquier caso de varios equipos simultáneos.
- `EventoMedidor` registra alta, verificación de identidad, instalación, retiro, falla, reparación, revisión y baja definitiva con fecha del hecho, fecha de registro, usuario, motivo, detalle y valores anteriores/nuevos.
- `MotivoMedidor` permite crear opciones por acción y desactivarlas sin borrar movimientos. Los eventos guardan también el nombre del motivo. No se cargaron motivos ficticios ni ejemplos del cuestionario como si fueran confirmados.
- La referencia opcional de trabajo permite vincular un antecedente externo. No se implementaron órdenes de trabajo completas ni bajas de servicio en esta etapa.
- Los endpoints antiguos de creación, edición, alternancia de estado y eliminación de medidores rechazan escrituras sin historial; las acciones usan el nuevo módulo.
- El cierre de instalación de una solicitud de agua o energía exige un equipo físico verificado, disponible, compatible con el servicio y una lectura inicial. El alta de ese medidor ya no genera un número `MED-...` automáticamente.
- Reutilizar exige identidad verificada, condición operativa y ausencia de instalación activa. Se requiere lectura final al retirar. No se permite retirar mientras tenga hojas de ruta abiertas.
- El cálculo de una nueva lectura parte, como mínimo, de la lectura inicial de la instalación. No se implementan reinicios de contador, vueltas del numerador ni estimaciones sin reglas confirmadas.
- Las consultas de lecturas usan la conexión guardada en la lectura, no la conexión actual del medidor. Las hojas de ruta guardan su contexto en `ContextoRutaMedidor` para conservar socio y número observados en ese recorrido después de un retiro/reutilización.

## Tratamiento de registros anteriores

Se conservaron los **12 medidores existentes**. Todos quedaron con identidad física pendiente de verificar, sin deducir que un número generado por el sistema acredita un equipo real. La condición inicial migrada es `PendienteRevision`.

Se encontraron **5 asignaciones heredadas pendientes de conciliación** en conexiones que tenían varios medidores activos. Se conservaron todas; no se escogió un medidor ni se borraron referencias. Las nuevas instalaciones se bloquean sobre esas conexiones. Deben revisarse físicamente, registrar los retiros que correspondan y revisar/verificar el medidor que permanece instalado.

Las asociaciones anteriores inactivas se registran como cerradas sin inventar fecha de retiro. Las fechas de instalación heredadas se conservan como datos previos no verificados. El evento de migración indica la fecha de incorporación al nuevo módulo, no simula la fecha de alta física original.

El historial territorial conserva sus **3 movimientos previos**. No se cargaron medidores, socios, ubicaciones, motivos o lecturas de prueba en la base de trabajo.

## Archivos principales

Frontend:

- `src/features/admin/pages/AdminTerritorio.jsx`, `src/utils/territory.js`: ámbito rural, localidad, ruta/folio y filtros.
- `src/features/admin/pages/AdminInventarioMedidores.jsx`, `src/utils/meters.js`: inventario, ficha, acciones, cronología y catálogo.
- `src/features/empleado/pages/InstalarMedidorDialog.jsx`, `EmpleadoInstalaciones.jsx`: selección física al finalizar una instalación.
- `src/features/socio/pages/SocioSolicitudServicioNueva.jsx`, `src/store/serviceWorkflowStore.js`: otra conexión de un servicio existente, envío de los datos del medidor y eliminación de la falsa confirmación local de solicitudes cuando falla la API.
- `src/App.jsx`, `src/components/Layout.jsx`, `src/utils/employeePermissions.js`: navegación y acceso.
- `tests/territory.test.js`: validaciones de ubicación rural, datos incompletos y conflictos.

API:

- `Controllers/InventarioMedidoresController.cs`: consultas, operaciones, permisos, transacciones e historial.
- `Controllers/TerritorioController.cs`: nuevos campos y filtros.
- `Controllers/SolicitudServicioController.cs`: instalación real y conexión independiente por solicitud.
- `Controllers/MedidorController.cs`: bloqueo de escrituras antiguas sin auditoría.
- `Controllers/MedicionController.cs`, `Controllers/RutasMedicionController.cs`: conservación de contexto y base de lectura inicial.
- `Controllers/ServicioSocioController.cs`: evita cambios masivos ambiguos en conexiones múltiples.
- `Medidor.cs`, `Model1.edmx`, `CooperativaAPI.csproj`: modelo nullable y registro del controlador.

Scripts reproducibles en `backend-snippets/etapa2` (carpeta exterior al frontend):

- `20260928_ConexionesMedidores.sql`: migración aditiva con restricciones y preservación de legado.
- `Verify-Etapa2.ps1` y `IntegrationTests.cs`: compilación y prueba HTTP sobre una copia aislada de SQL Server, eliminada al terminar.
- `Install-Etapa2.ps1`: respaldo verificado, aplicación y compilación de la API local.
- `verification-result.json`, `installation-result.json`: resultados y ubicaciones de respaldos.

## Validación y estado de entrega

- Compilación completa de C# con recursos EDMX correcta.
- **20 grupos de verificaciones de integración aprobados**: permisos, consultas reales, dos conexiones del mismo servicio, ubicación rural sin barrio, ceros iniciales, validación de ruta/folio, alta, instalación, lectura inicial/consumo, bloqueo de retiro con ruta abierta, instalaciones duplicadas por medidor y conexión, edición obsoleta, retiro, reutilización, conservación de lecturas/contexto, cierre de solicitud con equipo real, falla/reparación/revisión, baja definitiva y motivos inactivos.
- La migración se ejecutó dos veces en la copia aislada para comprobar repetibilidad. Los registros de prueba solo existieron en esa copia, eliminada al finalizar.
- Frontend compilado con Vite; 21 pruebas unitarias aprobadas. El build informa avisos de tamaño de bundle y antigüedad de datos de compatibilidad, sin errores de compilación.
- Base de trabajo migrada y archivos de API instalados sobre `feature/debora`. Se compiló la DLL con el compilador Roslyn del proyecto y los recursos EDMX, conservando la versión anterior en el respaldo.
- Respaldo SQL verificado antes de aplicar: `D:\Microsoft SQL Server\MSSQL16.MSSQLSERVER01\MSSQL\Backup\SocioApp_AplicacionEtapa2_20260928_141620.bak`.
- Respaldo de código y binarios: `App_Data\Etapa2Backup-20260928141620` dentro de la API. Estos respaldos no deben incorporarse a un commit.
- La comprobación final de solo lectura confirmó 12 medidores, 12 fichas pendientes de verificar, 5 asignaciones pendientes de conciliación y 3 movimientos territoriales conservados.
- **No se certifica la revisión visual de extremo a extremo**: el navegador disponible falló al iniciar por `sandboxPolicy`. Además, la API no estaba escuchando en `localhost:58234` al finalizar. Las pruebas HTTP se hicieron sobre el servidor en memoria con el código y SQL reales, no sobre una maqueta. Iniciar la API y el frontend para la revisión visual pendiente.

## Uso y decisiones pendientes

1. Administración: abrir **Conexiones y territorio** y completar localidad/ámbito/ruta/folio con información oficial; el barrio es opcional.
2. Administración: abrir **Medidores**, desplegar **Configurar motivos de movimientos** y cargar los motivos acordados para las acciones necesarias.
3. Revisar las fichas heredadas; verificar el número real y luego registrar la revisión física. Resolver las asignaciones conflictivas con evidencia real.
4. Las instalaciones desde solicitudes seleccionan un medidor disponible; el historial se consulta desde su ficha. Retirar un medidor no equivale a dar de baja el servicio.

Falta respuesta de la cooperativa para ratificar: cargos autorizados por operación, motivos habituales, casos excepcionales de varios medidores por conexión, reglas de reinicio o vuelta del contador, identificación oficial del padrón, unicidad de ruta/folio y listado territorial oficial. También faltan los flujos documentales detallados, formatos de facturación, conciliación, pagos y WhatsApp. No se inventaron esas reglas ni se implementaron sus integraciones.
