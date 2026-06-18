# 2. Diagramas de estado

## 2.1 Socio y empleado

```mermaid
stateDiagram-v2
    [*] --> Activo: alta correcta
    Activo --> Inactivo: suspension logica
    Inactivo --> Activo: reactivacion
    Activo --> [*]: eliminacion fisica excepcional
```

Reglas verificadas:

- El login rechaza empleados inactivos.
- Los listados administrativos muestran activos e inactivos.
- La suspension no deberia borrar datos relacionados.

Riesgo:

- Existe un endpoint de eliminacion de socio ademas del cambio de estado. Para produccion debe reservarse para casos controlados o eliminarse.

## 2.2 Solicitud de servicio

```mermaid
stateDiagram-v2
    [*] --> Pendiente: socio crea solicitud
    Pendiente --> EnRevision: admin comienza revision
    Pendiente --> Aprobada: aprobacion directa
    Pendiente --> Rechazada: rechazo con motivo
    Pendiente --> Cancelada: cancelacion
    EnRevision --> Aprobada: requisitos completos
    EnRevision --> Rechazada: incumplimiento
    EnRevision --> Cancelada: cancelacion
    Aprobada --> [*]
    Rechazada --> [*]
    Cancelada --> [*]
```

Efectos de aprobar verificados:

- Se crea o reactiva la asignacion `ServicioSocio`.
- Para el servicio Luz se intenta crear un medidor.
- Se guarda fecha de resolucion.

Brecha:

- La API actual permite llamar aprobar o rechazar sin comprobar el estado anterior. El diagrama representa el flujo funcional esperado, no una restriccion totalmente aplicada.

## 2.3 Reclamo

```mermaid
stateDiagram-v2
    [*] --> Pendiente: socio crea reclamo
    Pendiente --> EnProceso: admin inicia atencion
    Pendiente --> Cancelado: cancelacion justificada
    EnProceso --> Resuelto: solucion confirmada
    EnProceso --> Cancelado: cierre sin resolucion
    Resuelto --> [*]
    Cancelado --> [*]
```

Brecha:

- La API verifica que el estado exista, pero no limita la transicion segun el estado actual.
- La baja logica `Activo = false` es independiente del estado funcional.

## 2.4 Turno

```mermaid
stateDiagram-v2
    [*] --> Pendiente: socio solicita horario
    Pendiente --> Aprobado: admin aprueba
    Pendiente --> Propuesto: admin propone alternativa
    Pendiente --> Rechazado: admin rechaza
    Pendiente --> Cancelado: socio/admin cancela
    Propuesto --> Aceptado: socio acepta
    Propuesto --> Propuesto: admin modifica propuesta
    Propuesto --> Rechazado: admin rechaza
    Propuesto --> Cancelado: socio/admin cancela
    Aprobado --> Cancelado: cancelacion previa a atencion
    Aceptado --> Cancelado: cancelacion previa a atencion
    Rechazado --> [*]
    Cancelado --> [*]
```

Reglas verificadas:

- Solo dias habiles.
- Solo horarios permitidos.
- No se aceptan fechas u horas pasadas.
- Se usa transaccion y bloqueo para evitar doble reserva.
- La propuesta solo puede aceptarse si existe y sigue disponible.

Brecha:

- El endpoint administrativo resuelve cualquier ID de estado entre 1 y 6 y no implementa una matriz completa de transiciones.

## 2.5 Factura

```mermaid
stateDiagram-v2
    [*] --> Pendiente: emision
    Pendiente --> Vencida: fecha de vencimiento superada
    Pendiente --> Pagada: registrar pago
    Vencida --> Pagada: registrar pago
    Pagada --> Pendiente: desmarcar pago
    Pendiente --> Inactiva: baja logica
    Vencida --> Inactiva: baja logica
    Pagada --> Inactiva: baja logica
```

Observaciones:

- `Vencida` es calculado, no persistido.
- La API permite desmarcar una factura pagada. Esto requiere decision del cliente porque afecta trazabilidad contable.
- No existe entidad Pago real asociada a la factura.

## 2.6 Medidor

```mermaid
stateDiagram-v2
    [*] --> Activo: instalacion
    Activo --> Inactivo: suspension
    Inactivo --> Activo: rehabilitacion
    Activo --> Eliminado: solo sin mediciones asociadas
    Inactivo --> Eliminado: solo sin mediciones asociadas
```

Reglas verificadas:

- No se crea para una asignacion inexistente.
- Requiere tipo de medidor valido.
- No se elimina si tiene mediciones.
- Una medicion no se registra sobre un medidor inactivo.

## 2.7 Ruta de medicion

```mermaid
stateDiagram-v2
    [*] --> Pendiente: admin crea y asigna
    Pendiente --> EnCurso: lecturista inicia
    Pendiente --> EnCurso: primera lectura o incidencia
    Pendiente --> Cancelada: cancelacion
    EnCurso --> Finalizada: detalles resueltos y firma valida
    EnCurso --> Cancelada: cancelacion
    Finalizada --> [*]
    Cancelada --> [*]
```

Reglas verificadas:

- Una ruta cerrada no acepta lecturas.
- Solo el empleado asignado puede informar una lectura.
- Un medidor solo aparece una vez en una ruta.
- No puede asignarse si ya esta en una ruta pendiente o en curso.
- No se finaliza con detalles pendientes.
- La firma digital base64 es obligatoria.

## 2.8 Detalle de ruta

```mermaid
stateDiagram-v2
    [*] --> Pendiente
    Pendiente --> Medido: lectura valida
    Pendiente --> NoAcceso: domicilio inaccesible
    Pendiente --> MedidorDanado: equipo con falla
    Pendiente --> Observado: otra incidencia
    NoAcceso --> Pendiente: reintento
    MedidorDanado --> Pendiente: reintento posterior
    Observado --> Pendiente: reintento
    NoAcceso --> Medido: acceso posterior
    MedidorDanado --> Medido: equipo habilitado
    Observado --> Medido: observacion resuelta
    Medido --> [*]
```

Regla:

- Una medicion registrada no puede volver a otro estado desde la API actual.

## 2.9 Anuncio

```mermaid
stateDiagram-v2
    [*] --> Programado: activo y fecha de inicio futura
    Programado --> Publicado: llega fecha de inicio
    Publicado --> Vencido: supera fecha de fin
    Programado --> Inactivo: desactivacion
    Publicado --> Inactivo: desactivacion
    Vencido --> Publicado: se extiende fecha fin
    Inactivo --> Programado: reactivacion futura
    Inactivo --> Publicado: reactivacion vigente
```

Notas:

- Programado, Publicado y Vencido son estados derivados de `Activo`, `FechaInicio` y `FechaFin`.
- La prioridad esta normalizada en `PrioridadAnuncio`.

