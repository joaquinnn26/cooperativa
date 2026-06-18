# 7. Retrospectiva ante intentos de romper el sistema

## Que funciono bien

- Las reglas de turnos contemplan fechas pasadas, dias no habiles, horarios permitidos y concurrencia.
- Las mediciones rechazan valores negativos y retrocesos de lectura.
- Las rutas usan transacciones para lectura y finalizacion.
- La ruta no se cierra con medidores pendientes ni sin firma.
- Las suspensiones logicas preservan registros.
- Se centralizaron validaciones comunes del frontend.
- Las metricas del dashboard se obtienen de la base.
- Los anuncios se normalizaron y tienen vigencia real.

## Que se rompio o genero retrabajo

- El primer contexto EF de rutas intento modelar entidades antiguas sin claves detectadas.
- El modelo cambio sin actualizar la base y produjo error de compatibilidad.
- Se uso un nombre de navegacion incorrecto (`Detalles` en lugar de `RutaMedicionDetalle`).
- La tabla de anuncios no estaba ejecutada y el endpoint respondio 400.
- La prioridad de anuncio se modelo inicialmente como texto y luego se normalizo.
- Los listados filtraban suspendidos y parecian eliminados.
- El login interpretaba incorrectamente algunos empleados como inactivos.
- Varias vistas tenian datos locales o placeholders.

## Causa raiz

1. Cambios de esquema no acompañados inicialmente por una estrategia unica de migraciones.
2. Convivencia de EDMX Database First con un contexto Code First reducido.
3. Reglas distribuidas entre frontend, store y controladores.
4. Falta de pruebas automatizadas de regresion.
5. Falta de una matriz formal de estados antes de implementar.

## Acciones aplicadas

- Se desactivo el inicializador automatico del contexto auxiliar.
- Se mapearon explicitamente tablas y claves.
- Se agregaron scripts SQL idempotentes.
- Se corrigieron relaciones y nombres generados por EDMX.
- Se verificaron builds frontend y backend.
- Se agregaron validaciones reutilizables.
- Se migraron anuncios a una prioridad normalizada.

## Acciones pendientes

| Accion | Prioridad | Responsable | Fecha objetivo |
| --- | --- | --- | --- |
| Aplicar JWT y roles en todos los endpoints | Critica | | |
| Crear pruebas automatizadas de estados | Critica | | |
| Implementar matriz de transiciones central | Alta | | |
| Crear entidad Pago y conciliacion | Alta | | |
| Implementar recuperacion/cambio de clave | Alta | | |
| Reemplazar errores internos por respuestas seguras | Alta | | |
| Definir auditoria de cambios | Alta | | |
| Completar reportes reales | Media | | |
| Unificar estrategia de migraciones | Alta | | |
| Ejecutar validacion con cooperativa | Critica | | |

## Conclusion

El intento de romper el sistema mostro que los flujos operativos complejos tienen buenas defensas, pero tambien que la seguridad backend, la consistencia de estados y la automatizacion de pruebas deben ser requisitos de cierre, no tareas posteriores.

