# 6. Validacion de casos borde con la cooperativa

## Estado

Documento preparado. **No firmado ni validado aun.**

No se debe afirmar que la cooperativa aprobo estas decisiones hasta realizar la reunion y registrar responsables.

## Datos de reunion

- Fecha:
- Lugar o medio:
- Representante de la cooperativa:
- Rol del representante:
- Integrantes del equipo:
- Version evaluada:

## Decisiones que requieren respuesta

| ID | Pregunta | Opcion recomendada | Decision cliente |
| --- | --- | --- | --- |
| VC-01 | Puede ingresar un socio suspendido para consultar deuda? | Permitir solo consulta y bloquear tramites | |
| VC-02 | Una solicitud aprobada puede reabrirse? | No; crear una nueva o proceso de revocacion auditado | |
| VC-03 | Rechazar solicitud exige motivo? | Si, obligatorio | |
| VC-04 | Un reclamo resuelto puede reabrirse? | Si, mediante accion Reabrir y trazabilidad | |
| VC-05 | Puede borrarse un reclamo activo? | No; cancelar con motivo | |
| VC-06 | Cuanto tiempo antes puede cancelarse un turno? | Definir ventana operativa | |
| VC-07 | Un turno aprobado cuenta como horario ocupado? | Si | |
| VC-08 | Se exige foto ante medidor danado? | Recomendado: si | |
| VC-09 | Se exige geolocalizacion de la lectura? | Recomendado segun disponibilidad y consentimiento | |
| VC-10 | Quien firma la hoja de ruta? | Lecturista responsable | |
| VC-11 | Puede modificarse una hoja finalizada? | No; solo rectificacion auditada | |
| VC-12 | Puede desmarcarse una factura pagada? | No; usar anulacion/nota de ajuste | |
| VC-13 | Puede darse de baja una factura pagada? | Solo con motivo y auditoria | |
| VC-14 | Que datos debe guardar un pago? | Referencia unica, metodo, monto, fecha, usuario y estado | |
| VC-15 | Cuantos anuncios fijos pueden coexistir? | Permitir varios, ordenar por prioridad | |
| VC-16 | Quien puede publicar anuncios? | Administrador autorizado | |
| VC-17 | Los anuncios urgentes requieren doble confirmacion? | Recomendado | |
| VC-18 | Cuanto tiempo se conservan documentos y firmas? | Definir politica legal/operativa | |

## Casos demostrados al cliente

Completar durante la reunion:

| Caso | Resultado mostrado | Aprobado | Observacion |
| --- | --- | --- | --- |
| Lectura menor a la anterior | Rechazo con mensaje | | |
| Ruta con medidores pendientes | No permite finalizar | | |
| Firma faltante o invalida | No permite finalizar | | |
| Doble reserva de turno | Segundo intento recibe conflicto | | |
| Solicitud de servicio duplicada | | | |
| Factura pagada dos veces | | | |
| Empleado suspendido intenta ingresar | Rechazo | | |
| Anuncio fuera de vigencia | No visible | | |

## Acta de conformidad

Las partes declaran que revisaron los casos anteriores. Las decisiones registradas se incorporaran al backlog y seran la referencia funcional para futuros cambios.

- Firma representante cooperativa:
- Aclaracion:
- Firma Product Owner:
- Aclaracion:
- Fecha:

