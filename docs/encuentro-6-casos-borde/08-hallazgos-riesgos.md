# 8. Hallazgos, riesgos y plan de cierre

## Hallazgos criticos

### 1. Autorizacion solo efectiva en frontend

`ProtectedRoute` separa pantallas por rol, pero ningun controlador auditado usa `JwtAuthorizeAttribute`.

Impacto:

- Un cliente externo podria invocar endpoints administrativos sin pasar por React.

Accion:

- Aplicar autenticacion y autorizacion por rol en la API.
- Incluir claims de rol, socio y empleado en el token.
- Verificar propiedad del recurso, no solo rol.

### 2. Transiciones de estado abiertas

Solicitudes, reclamos y administracion de turnos no aplican una matriz completa de origen-destino.

Impacto:

- Estados terminales pueden reabrirse o saltarse pasos sin trazabilidad.

Accion:

- Crear servicios de dominio para cada maquina de estados.
- Rechazar transiciones invalidas con 409.
- Guardar historial de cambios.

### 3. Sin pruebas automatizadas

No hay script `test` ni proyecto de pruebas de API.

Impacto:

- Cada cambio puede reintroducir errores ya corregidos.

Accion:

- Priorizar autenticacion, turnos, rutas, mediciones, solicitudes y facturas.

## Hallazgos altos

- La API de facturas no comprueba que el servicio pertenezca al socio.
- Marcar pago permite revertir una factura pagada sin auditoria.
- Pagos usa datos locales y no representa transacciones reales.
- Recuperacion y cambio de contrasena no existen en backend.
- Varios `catch` exponen `ex.Message`.
- No existe auditoria uniforme de quien realizo cada cambio.
- Los archivos subidos requieren politicas adicionales de tamano, almacenamiento y antivirus.
- La generacion de numero de medidor basada en `Max + 1` puede colisionar bajo concurrencia.

## Hallazgos medios

- Validaciones duplicadas entre capas.
- Estados escritos como texto en rutas y detalles.
- Fallbacks locales pueden ocultar caidas de API.
- Reportes sigue siendo placeholder.
- No hay paginacion server-side general.
- No hay politica documentada de respaldo y recuperacion.
- No hay observabilidad: logs estructurados, alertas y correlation ID.

## Plan de cierre recomendado

### Fase 1 - Antes de defensa

1. Ejecutar matriz manual P01-P56.
2. Guardar evidencias.
3. Aplicar autorizacion al menos a endpoints administrativos.
4. Validar con cliente las decisiones VC-01 a VC-18.
5. Corregir transiciones criticas de solicitud, reclamo y factura.

### Fase 2 - Antes de piloto real

1. Tests automatizados.
2. Pago real y trazabilidad.
3. Recuperacion segura de contrasena.
4. Auditoria de operaciones.
5. Migraciones versionadas.
6. Backups y monitoreo.

### Fase 3 - Antes de produccion masiva

1. Pruebas de carga.
2. Revision de seguridad.
3. Politicas de privacidad y retencion.
4. Despliegue con HTTPS, secretos externos y rotacion.
5. Plan de contingencia y soporte.

## Evaluacion de la consigna

| Requisito | Cobertura documental |
| --- | --- |
| Diagramas de estado | Completo |
| Casos borde desde estados | Completo |
| Lista de excepciones | Completo |
| Validaciones reales | Inventariadas |
| Sistema explica rechazos | Evaluado con brechas |
| Sprint 4 | Documentado |
| Validacion con cliente | Instrumento listo; reunion pendiente |
| Retrospectiva | Completa |

