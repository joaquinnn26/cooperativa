# 4. Validaciones reales y matriz de pruebas

## Validaciones frontend verificadas

- Correo con estructura usuario, arroba y dominio.
- Nombre y apellido solo con letras, espacios, apostrofe y guion.
- Documento de 7 a 9 digitos.
- Telefono de 7 a 20 caracteres permitidos.
- Clave fuerte: 8 caracteres, mayuscula, minuscula, numero y simbolo.
- Montos positivos.
- Fechas validas y, segun formulario, actuales o futuras.
- Campos obligatorios.
- Limpieza de espacios.
- Limites de longitud en anuncios, turnos, observaciones y otros formularios.
- URL de pago con protocolo HTTP o HTTPS.

## Validaciones backend destacadas

### Fuertes

- Turnos: fecha, dia habil, horario, disponibilidad y concurrencia.
- Mediciones: entidades activas, lectura no negativa y monotonicidad.
- Rutas: pertenencia, estados, duplicados, cierre, firma y transaccion.
- Documentos: solicitud, requisito y tipo de archivo.
- Anuncios: longitud, fechas y prioridad catalogada.

### Parciales

- Factura valida referencias, pero no todas las reglas de monto, fecha y pertenencia.
- Solicitud permite aprobar/rechazar sin validar estado origen.
- Reclamo permite cualquier estado existente sin validar transicion.
- Socio y empleado tienen validaciones de negocio, pero no una capa DTO uniforme.

## Seguridad observada

| Control | Estado |
| --- | --- |
| JWT generado en login | Verificado |
| Token enviado desde frontend | Verificado |
| Rutas React separadas por rol | Verificado |
| Filtro JWT implementado | Verificado |
| Filtro JWT aplicado a controladores | No |
| Autorizacion de rol en API | No |
| Consultas parametrizadas en turnos | Verificado |
| Entity Framework para CRUD | Verificado |
| Mensajes sin datos internos | Parcial |
| Pruebas automatizadas | No |

## Matriz minima de ejecucion manual

Usar una base de prueba. Guardar captura de request, response y estado final.

| Prueba | Preparacion | Accion | Esperado |
| --- | --- | --- | --- |
| P01 | Empleado activo | Login valido | 200 y token |
| P02 | Empleado inactivo | Login valido | 400 inactivo |
| P03 | Usuario inexistente | Login | 401 |
| P04 | Documento ya registrado | Alta socio | 400 duplicado |
| P05 | Nombre con numeros | Alta socio | Formulario bloquea |
| P06 | Email invalido | Alta socio | Formulario bloquea |
| P07 | Solicitud nueva | Crear | Estado Pendiente |
| P08 | Solicitud Pendiente | Aprobar | Aprobada y ServicioSocio |
| P09 | Solicitud Luz | Aprobar sin TipoMedidor | Rollback |
| P10 | Solicitud Aprobada | Aprobar nuevamente | Debe rechazarse; hoy revisar |
| P11 | Solicitud | Rechazar sin motivo | Debe rechazarse; API pendiente |
| P12 | Turno dia habil | Crear horario libre | Pendiente |
| P13 | Turno fin de semana | Crear | 400 |
| P14 | Turno fecha pasada | Crear | 400 |
| P15 | Horario ocupado | Dos altas concurrentes | Una 200 y otra 409 |
| P16 | Turno Pendiente | Admin propone | Propuesto |
| P17 | Turno Propuesto | Socio acepta | Aceptado |
| P18 | Propuesta ocupada | Socio acepta | 409 |
| P19 | Medidor activo | Lectura mayor | Medicion creada |
| P20 | Medidor activo | Lectura menor | 400 |
| P21 | Medidor inactivo | Cargar lectura | 400 |
| P22 | Medidor con mediciones | Eliminar | 400 |
| P23 | Lecturista y medidores libres | Crear ruta | Pendiente |
| P24 | Medidor en ruta abierta | Crear otra ruta | 400 |
| P25 | Ruta Pendiente | Iniciar | EnCurso |
| P26 | Empleado distinto | Cargar lectura | 400 |
| P27 | Medidor ajeno | Cargar lectura | 400 |
| P28 | Detalle Medido | Cargar nuevamente | 400 |
| P29 | Ruta con pendientes | Finalizar | 400 |
| P30 | Ruta resuelta sin firma | Finalizar | 400 |
| P31 | Firma invalida | Finalizar | 400 |
| P32 | Ruta resuelta y firma valida | Finalizar | Finalizada |
| P33 | Ruta Finalizada | Cancelar | 400 |
| P34 | Factura valida | Crear | Pendiente |
| P35 | Monto negativo | Crear | Debe ser 400; API pendiente |
| P36 | Factura no vencida | Consultar | Pendiente |
| P37 | Factura vencida | Consultar | Vencida |
| P38 | Factura impaga | Marcar pago | Pagada y fecha de pago |
| P39 | Factura pagada | Desmarcar | Hoy permitido; validar cliente |
| P40 | Reclamo valido | Crear | Pendiente |
| P41 | Reclamo vacio | Crear | 400 |
| P42 | Socio inactivo | Crear reclamo | 400 |
| P43 | Reclamo Pendiente | Pasar En Proceso | Actualizado |
| P44 | Reclamo Resuelto | Pasar Pendiente | Debe rechazarse; hoy permitido |
| P45 | Anuncio vigente | Crear | Visible publico/socio |
| P46 | Anuncio futuro | Crear | No visible hasta inicio |
| P47 | Anuncio vencido | Consultar publico | No listado |
| P48 | Fin anterior a inicio | Crear anuncio | 400 |
| P49 | Prioridad inexistente | Crear anuncio | 400 |
| P50 | Anuncio activo | Desactivar | No visible |
| P51 | Token ausente | Llamar endpoint admin | Debe ser 401; hoy riesgo |
| P52 | Token Socio | Llamar endpoint admin | Debe ser 403; hoy riesgo |
| P53 | API detenida | Abrir panel | Mensaje controlado |
| P54 | Error SQL | Ejecutar operacion | No exponer detalle interno |
| P55 | Archivo no permitido | Subir documento | 400 |
| P56 | Documento a solicitud inexistente | Subir | 400 |

## Evidencia requerida por prueba

1. ID de prueba.
2. Fecha y responsable.
3. Datos usados, anonimizados.
4. Captura del formulario.
5. Request y status HTTP.
6. Mensaje recibido.
7. Consulta o captura del estado final.
8. Resultado: pasa, falla o bloqueada.
9. Incidencia asociada si falla.

## Automatizacion recomendada

- Backend: MSTest, NUnit o xUnit con una base aislada.
- Frontend: Vitest y React Testing Library.
- Integracion: coleccion Postman/Newman.
- End-to-end: Playwright.
- Pipeline: ejecutar build y tests en cada merge.

