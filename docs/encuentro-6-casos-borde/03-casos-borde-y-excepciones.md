# 3. Casos borde y lista de excepciones

## Criterio

Los casos se derivan de estados y reglas observadas. No se agregan escenarios ajenos al dominio.

## Autenticacion y personas

| ID | Caso borde | Resultado esperado | Situacion |
| --- | --- | --- | --- |
| CB-A01 | Login sin correo o clave | Rechazar indicando datos invalidos | Verificado |
| CB-A02 | Clave incorrecta | Responder 401 sin revelar cual campo fallo | Verificado |
| CB-A03 | Empleado inactivo intenta ingresar | Rechazar e indicar inactividad | Verificado |
| CB-A04 | Socio inactivo intenta ingresar | Definir y aplicar la misma politica | Cliente / pendiente |
| CB-A05 | Alta con documento duplicado | Rechazar | Verificado para socio |
| CB-A06 | Alta de empleado para persona ya empleada | Rechazar | Verificado |
| CB-A07 | Usuario cambia rol en almacenamiento local | Backend debe rechazar acceso | No cubierto |
| CB-A08 | Token vencido o alterado | Responder 401 | Filtro existente, no aplicado |
| CB-A09 | Recuperacion de clave | Enviar flujo seguro | No implementado |
| CB-A10 | Cambio de clave sin clave actual | Rechazar | No implementado |

## Solicitudes de servicio

| ID | Caso borde | Resultado esperado | Situacion |
| --- | --- | --- | --- |
| CB-S01 | Solicitud sin socio o servicio | Rechazar | Parcial |
| CB-S02 | Solicitud duplicada activa para mismo servicio | Rechazar | Front parcial; API no asegura |
| CB-S03 | Aprobar solicitud ya aprobada | Rechazar o responder idempotente | No cubierto |
| CB-S04 | Rechazar solicitud aprobada | Rechazar transicion | No cubierto |
| CB-S05 | Rechazo sin motivo | Rechazar | Front cubre; API no valida |
| CB-S06 | Aprobar servicio inexistente | Rechazar | Verificado |
| CB-S07 | Aprobar Luz sin tipo de medidor | Rollback y explicar | Verificado |
| CB-S08 | Aprobar cuando ya existe ServicioSocio activo | No duplicar | Verificado |
| CB-S09 | Dos aprobaciones concurrentes | Crear una sola asignacion/medidor | Riesgo |
| CB-S10 | Documento de extension no permitida | Rechazar | Verificado |
| CB-S11 | Documento para solicitud inexistente | Rechazar | Verificado |
| CB-S12 | Documento repetido para el mismo requisito | Definir reemplazo o rechazo | Cliente |

## Turnos

| ID | Caso borde | Resultado esperado | Situacion |
| --- | --- | --- | --- |
| CB-T01 | Fecha pasada | Rechazar | Verificado |
| CB-T02 | Sabado o domingo | Rechazar | Verificado |
| CB-T03 | Horario fuera de agenda | Rechazar | Verificado |
| CB-T04 | Horario de hoy que ya paso | Rechazar | Verificado |
| CB-T05 | Dos usuarios reservan el mismo horario | Uno recibe 409 | Verificado |
| CB-T06 | Aceptar propuesta inexistente | Rechazar | Verificado |
| CB-T07 | Aceptar propuesta cuyo horario fue ocupado | Responder 409 | Verificado |
| CB-T08 | Aprobar turno con horario ocupado | Responder 409 | Verificado |
| CB-T09 | Cancelar turno ya cancelado | Respuesta idempotente o rechazo claro | Revisar |
| CB-T10 | Admin pasa Rechazado a Aceptado | Rechazar transicion | No cubierto |
| CB-T11 | Motivo vacio | Rechazar | Verificado |
| CB-T12 | Motivo excesivamente largo | Rechazar consistentemente | Front parcial |

## Medidores, mediciones y rutas

| ID | Caso borde | Resultado esperado | Situacion |
| --- | --- | --- | --- |
| CB-M01 | Lectura negativa | Rechazar | Verificado |
| CB-M02 | Lectura menor a la anterior | Rechazar | Verificado |
| CB-M03 | Medidor inexistente o inactivo | Rechazar | Verificado |
| CB-M04 | Empleado inexistente o inactivo | Rechazar | Verificado |
| CB-M05 | Tipo de lectura inexistente | Rechazar | Verificado |
| CB-M06 | Dos lecturas simultaneas del mismo medidor | Serializar y evitar consumo incorrecto | Cubierto en ruta; revisar endpoint general |
| CB-M07 | Eliminar medidor con mediciones | Rechazar | Verificado |
| CB-R01 | Crear ruta sin lecturista | Rechazar | Verificado |
| CB-R02 | Crear ruta sin medidores | Rechazar | Verificado |
| CB-R03 | Mas de 300 medidores | Rechazar | Verificado |
| CB-R04 | Medidor duplicado en la solicitud | Deduplicar o rechazar | Verificado por `Distinct` |
| CB-R05 | Medidor ya asignado a ruta abierta | Rechazar | Verificado |
| CB-R06 | Lecturista carga medidor de otra ruta | Rechazar | Verificado |
| CB-R07 | Otro empleado carga la lectura | Rechazar | Verificado |
| CB-R08 | Cargar lectura sobre ruta finalizada/cancelada | Rechazar | Verificado |
| CB-R09 | Cargar dos veces el mismo detalle | Rechazar | Verificado |
| CB-R10 | Finalizar con pendientes | Rechazar | Verificado |
| CB-R11 | Finalizar sin firma | Rechazar | Verificado |
| CB-R12 | Firma base64 invalida | Rechazar | Verificado |
| CB-R13 | Cancelar ruta finalizada | Rechazar | Verificado |
| CB-R14 | Geolocalizacion ausente | Permitir o exigir segun politica | Cliente |
| CB-R15 | Foto ausente en incidencia | Permitir o exigir segun politica | Cliente |

## Facturas y pagos

| ID | Caso borde | Resultado esperado | Situacion |
| --- | --- | --- | --- |
| CB-F01 | Monto cero o negativo | Rechazar | Front cubre; API parcial |
| CB-F02 | Vencimiento anterior a emision | Rechazar | Front cubre alta; API no asegura |
| CB-F03 | Socio inexistente | Rechazar | Verificado |
| CB-F04 | Empleado inexistente | Rechazar | Verificado |
| CB-F05 | Servicio inexistente | Rechazar | Verificado |
| CB-F06 | Facturar servicio que no pertenece al socio | Rechazar | No cubierto |
| CB-F07 | Pagar factura ya pagada | Idempotente, no duplicar pago | Parcial |
| CB-F08 | Desmarcar pago confirmado | Bloquear o auditar | Cliente / riesgo |
| CB-F09 | Baja de factura pagada | Bloquear o exigir motivo | No cubierto |
| CB-F10 | Link de pago invalido | Rechazar | Front cubre; API no asegura |
| CB-P01 | Registrar transaccion real | Guardar metodo, referencia, fecha y monto | No implementado |
| CB-P02 | Referencia de pago duplicada | Rechazar | No implementado |

## Reclamos y anuncios

| ID | Caso borde | Resultado esperado | Situacion |
| --- | --- | --- | --- |
| CB-C01 | Reclamo sin descripcion | Rechazar | Verificado |
| CB-C02 | Reclamo de socio inactivo | Rechazar | Verificado |
| CB-C03 | Tipo inexistente | Rechazar | Verificado |
| CB-C04 | Estado inexistente | Rechazar | Verificado |
| CB-C05 | Resuelto vuelve a Pendiente | Bloquear o exigir reapertura auditada | No cubierto |
| CB-C06 | Baja de reclamo no resuelto | Definir politica | Cliente |
| CB-N01 | Anuncio sin titulo/contenido | Rechazar | Verificado |
| CB-N02 | Fecha fin anterior a inicio | Rechazar | Verificado |
| CB-N03 | Prioridad inexistente/inactiva | Rechazar | Verificado |
| CB-N04 | Anuncio vencido | No mostrar al publico | Verificado |
| CB-N05 | Varios anuncios fijos | Mostrar por prioridad y fecha | Verificado en consulta/banner |
| CB-N06 | Desactivar anuncio | Dejar de mostrar sin borrar | Verificado |

## Lista de excepciones tecnicas

| Excepcion | Respuesta esperada |
| --- | --- |
| Recurso inexistente | 404 |
| Datos faltantes o formato invalido | 400 con mensaje funcional |
| Conflicto de concurrencia o duplicado | 409 |
| Token ausente, invalido o vencido | 401 |
| Rol sin permiso | 403 |
| Archivo no permitido | 400 |
| Regla de estado invalida | 409 o 400 explicativo |
| Error inesperado | 500 con identificador; sin exponer detalles SQL |
| API no disponible | Front informa indisponibilidad y conserva datos no enviados |

