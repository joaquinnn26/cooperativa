# 10. Correcciones implementadas

## Alcance

Fecha de cierre tecnico: 17 de junio de 2026.

Se corrigieron los hallazgos aplicables sin incorporar una pasarela ni una entidad de pago real.

## Seguridad y credenciales

- JWT con roles y claims de usuario, socio y empleado.
- El frontend valida la sesion contra `api/auth/session` y no confia en el rol guardado en `localStorage`.
- El filtro JWT compara en cada solicitud el rol firmado con el rol y estado actuales de la base.
- Autorizacion aplicada a facturas, turnos, solicitudes, reclamos, medidores, mediciones, rutas, documentos, requisitos y asignaciones.
- Validacion de propiedad para recursos consultados o modificados por socios y empleados.
- Ruta canonica `api/medidor/socio/{idSocio}` para que cada socio consulte solo sus medidores.
- CORS habilitado para los clientes locales configurados en `FrontendUrl` y `127.0.0.1:5173`.
- Login bloqueado para socios y empleados inactivos.
- Nuevas contrasenas almacenadas con BCrypt; hashes SHA-256 existentes se migran al iniciar sesion correctamente.
- Cambio de contrasena exige la clave actual y una nueva clave fuerte.
- Recuperacion mediante token de un solo uso con vencimiento de 30 minutos y envio por SMTP.

El servidor SMTP debe configurarse en `Web.config` mediante `system.net/mailSettings`.
En desarrollo puede habilitarse `ExposePasswordResetToken=true`; no debe habilitarse en produccion.

## Estados y reglas de negocio

- Solicitudes: solo Pendiente o En Revision pueden aprobarse o rechazarse; el rechazo exige motivo.
- Reclamos: matriz Pendiente -> En Proceso/Cancelado y En Proceso -> Resuelto/Cancelado.
- Turnos: matriz de transiciones, propiedad por socio, cancelacion idempotente y sin eliminacion fisica.
- Servicios del socio: activacion y baja logica, sin borrar relaciones historicas.
- Rutas: solo el empleado asignado puede iniciar, cargar, informar incidencias o finalizar.

## Facturas

- Monto estrictamente positivo.
- Vencimiento igual o posterior a la emision.
- Link de pago limitado a URL HTTP/HTTPS.
- El servicio debe estar activo para el socio.
- Marcar pagada es idempotente.
- Una factura pagada no puede volver a pendiente ni darse de baja.
- La pantalla Pagos ya no muestra transacciones ficticias; lista facturas informadas como pagadas.

## Archivos

- Extensiones permitidas: PDF, JPG, JPEG, PNG y WEBP.
- Tamano maximo: 5 MB.
- Validacion de propiedad de la solicitud.
- El requisito debe pertenecer al servicio solicitado.
- Un nuevo archivo reemplaza al anterior para el mismo requisito.
- No se modifican documentos de solicitudes cerradas.

## Frontend y disponibilidad

- Los fallos de API en mediciones y rutas ya no generan datos locales que aparenten una operacion exitosa.
- Reportes calcula indicadores desde facturas y reclamos reales y permite exportar CSV.
- Cambio y recuperacion de contrasena consumen endpoints definidos, sin probar rutas inexistentes.
- Las validaciones de nombres y direcciones aceptan letras Unicode.
- El administrador puede crear rutas de medicion asignandolas a cualquier empleado activo; los lecturistas se muestran primero y se informa si faltan empleados o medidores.

## Verificacion

- `npm run build`: correcto.
- `npm test`: 13 pruebas, 13 correctas.
- Solucion ASP.NET Web API con MSBuild Debug/Any CPU: correcta, sin errores ni advertencias.

## Exclusion

No se implemento cobro, conciliacion bancaria, referencia de transaccion, medio de pago ni pasarela real.
