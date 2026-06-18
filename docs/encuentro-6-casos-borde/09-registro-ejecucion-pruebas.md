# 9. Registro de ejecucion y evidencias

## Instrucciones

Duplicar una fila por cada intento. No reemplazar una falla por un intento posterior exitoso: ambos deben quedar registrados.

## Datos del ambiente

- Version frontend:
- Version API:
- Base de datos:
- Fecha de respaldo:
- Navegador/dispositivo:
- Responsable:
- Fecha:

## Registro

| Ejecucion | Caso | Fecha | Responsable | Resultado esperado | Resultado obtenido | HTTP | Estado final BD | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-001 | P01 | | | 200 y token | | | | | Pendiente |
| E-002 | P02 | | | Rechazo por inactividad | | | | | Pendiente |
| E-003 | P07 | | | Solicitud Pendiente | | | | | Pendiente |
| E-004 | P10 | | | Rechazar doble aprobacion | | | | | Pendiente |
| E-005 | P15 | | | Un 200 y un 409 | | | | | Pendiente |
| E-006 | P20 | | | Rechazar lectura menor | | | | | Pendiente |
| E-007 | P24 | | | Rechazar medidor ocupado | | | | | Pendiente |
| E-008 | P29 | | | Rechazar cierre incompleto | | | | | Pendiente |
| E-009 | P31 | | | Rechazar firma invalida | | | | | Pendiente |
| E-010 | P35 | | | Rechazar monto negativo | | | | | Pendiente |
| E-011 | P39 | | | Segun decision cliente | | | | | Pendiente |
| E-012 | P44 | | | Rechazar reapertura directa | | | | | Pendiente |
| E-013 | P48 | | | Rechazar fechas invalidas | | | | | Pendiente |
| E-014 | P51 | 2026-06-17 | Codex | 401 sin token | Factura y admin/turnos rechazaron la llamada | 401 | Sin cambios | Consola de verificacion | Pasa |
| E-015 | P52 | | | 403 para rol Socio | | | | | Pendiente |

## Clasificacion

- Pasa: coincide completamente con lo esperado.
- Falla: el sistema permite una operacion invalida o deja datos inconsistentes.
- Parcial: rechaza, pero el status o mensaje no es correcto.
- Bloqueada: no puede ejecutarse por falta de datos, ambiente o funcionalidad.

## Incidencias

| ID | Prueba origen | Severidad | Descripcion | Causa | Correccion | Reprueba |
| --- | --- | --- | --- | --- | --- | --- |
| INC-001 | | | | | | |

## Convencion de evidencias

Guardar archivos con este formato:

`CASO-EJECUCION-resultado-fecha.ext`

Ejemplo:

`P15-E005-conflicto-doble-turno-2026-06-17.png`

No incluir contrasenas, tokens completos, documentos reales ni datos sensibles.
