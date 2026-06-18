# Entrega Encuentro 6 - Casos borde

## Documento oficial unico

La entrega consolidada y actualizada se encuentra en:

[ENTREGA-UNICA.md](ENTREGA-UNICA.md)

Los archivos numerados se conservan como material de trabajo y trazabilidad historica.

## Objetivo

Responder la pregunta eje: **Que pasa cuando algo sale mal?**

Esta entrega fue construida mediante revision del frontend React, la API ASP.NET Web API, el modelo Entity Framework y los catalogos reales de la base `Cooperativa`.

## Documentos

1. [Portada y guion de defensa](00-portada-y-guion-defensa.md)
2. [Inventario y alcance](01-inventario-y-alcance.md)
3. [Diagramas de estado](02-diagramas-de-estado.md)
4. [Casos borde y excepciones](03-casos-borde-y-excepciones.md)
5. [Validaciones y matriz de pruebas](04-validaciones-y-matriz-pruebas.md)
6. [Sprint 4 documentado](05-sprint-4.md)
7. [Validacion con el cliente](06-validacion-cliente.md)
8. [Retrospectiva](07-retrospectiva.md)
9. [Hallazgos, riesgos y plan de cierre](08-hallazgos-riesgos.md)
10. [Registro de ejecucion y evidencias](09-registro-ejecucion-pruebas.md)
11. [Correcciones implementadas](10-correcciones-implementadas.md)

## Criterio de evidencia

Cada afirmacion usa una de estas categorias:

| Marca | Significado |
| --- | --- |
| Verificado | Existe en el codigo o fue consultado en la base de datos |
| Parcial | Existe, pero la regla no esta aplicada en todas las capas |
| Propuesto | Comportamiento recomendado que todavia debe implementarse |
| Cliente | Decision que requiere confirmacion de la cooperativa |

## Resultado ejecutivo

El sistema implementa flujos reales para socios, empleados, solicitudes, reclamos, turnos, facturas, medidores, mediciones, rutas y anuncios. Los flujos con mejor defensa ante casos borde son turnos, mediciones y rutas de medicion.

Luego de la etapa de correccion:

- Los endpoints operativos criticos aplican JWT, roles y control de propiedad.
- Solicitudes, reclamos y turnos restringen transiciones invalidas.
- Facturas validan monto, fechas, URL y pertenencia del servicio.
- No se permite revertir un pago confirmado ni dar de baja una factura pagada.
- Recuperacion y cambio de contrasena cuentan con endpoints reales.
- Reportes usan datos actuales y exportan CSV.
- Existe una suite automatizada inicial de validaciones.
- El pago real sigue excluido y falta evidencia firmada de decisiones del cliente.

Estas brechas no se ocultan: forman parte de la retrospectiva y del plan de mejora.
