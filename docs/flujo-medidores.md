# Inventario y trabajos técnicos de medidores

Actualización del 28/09/2026. Se conserva la estructura React, Web API y SQL Server existente.

## Cómo se utiliza

1. **Medidores** abre el inventario en la vista **Disponibles**. Las otras vistas son Instalados, Por revisar, Baja definitiva y Todos. Registrar un medidor aquí no lo instala ni lo asigna a un socio.
2. Desde la ficha se consultan sus instalaciones, lecturas iniciales/finales y movimientos. Administración puede modificar los datos con un motivo; el historial muestra valores anteriores y nuevos. Los datos heredados sin verificar se confirman junto con la condición física.
3. **Instalaciones → Nuevas instalaciones** conserva las solicitudes pendientes. Al completar una instalación de agua o electricidad, el técnico elige un equipo disponible del inventario o registra el equipo nuevo en el mismo formulario. El contexto de socio, servicio y domicilio proviene de la solicitud.
4. **Instalaciones → Reemplazos y retiros** permite buscar los equipos instalados por socio, número, domicilio, ruta o folio. Para reemplazar: identificar el equipo anterior, cargar lectura final y condición, elegir/registrar el siguiente, cargar lectura inicial y motivo, confirmar.
5. Un retiro independiente conserva el historial y no da de baja el servicio. El equipo retirado operativo y verificado vuelve a estar disponible; los averiados o pendientes de revisión no se ofrecen para instalar. La baja definitiva solo se permite sin instalación activa.

El administrador también tiene acceso a Instalaciones. El técnico puede registrar equipos nuevos dentro de un trabajo de instalación/reemplazo; el alta independiente, edición y baja definitiva del inventario quedan a cargo de administración.

## Integridad e historial

- Instalación de solicitud: alta opcional del equipo, conexión, asignación y aprobación se guardan en una transacción.
- Reemplazo: retiro, alta opcional, instalación y eventos se guardan en una transacción. Un error revierte todo.
- Se controlan números duplicados, equipo instalado en otra conexión, compatibilidad de tipo/servicio, lecturas y versiones desactualizadas. Las hojas de ruta abiertas bloquean el retiro y, por lo tanto, el reemplazo.
- Cada operación compuesta tiene `OperacionId`; los historiales enlazan los dos medidores de un reemplazo. Para estadísticas de reemplazos debe contarse la operación distinta, no sumar sus eventos de alta/retiro/instalación.
- Se conservan lecturas y asignaciones históricas, sin eliminaciones físicas. Las fechas nuevas se envían a SQL como `datetime2(3)` para evitar diferencias de redondeo entre pasos de la misma operación.
- Los conflictos heredados de varios medidores en una conexión continúan visibles y bloquean reemplazos hasta su conciliación. No se inventan números físicos ni condiciones para resolverlos automáticamente.

## Configuración real pendiente

En Medidores, administración puede desplegar **Configurar motivos de movimientos** y cargar los motivos reales de la cooperativa, incluidos Modificar datos y Reemplazo. No se precargaron motivos ficticios ni se alteraron registros reales de medidores para las pruebas.

## Aplicación y verificación

La API efectiva está en `C:\Users\pc\Desktop\facultad\CooperativaAPIv2\CooperativaAPI\CooperativaAPI`.

La entrega reproducible está en `../backend-snippets/medidores-flujo` respecto del repositorio frontend: migración `20260928_FlujoMedidores.sql`, controladores, `Verify-FlujoMedidores.ps1`, `Install-FlujoMedidores.ps1` y pruebas HTTP de integración.

- 30 grupos de verificación HTTP/SQL aprobados sobre una copia aislada de la base. La copia se elimina al terminar y las pruebas no escriben datos de prueba en Cooperativa.
- 24 pruebas de frontend y compilación de producción.
- Migración y API compilada aplicadas localmente, con respaldo SQL verificado y respaldo de archivos; las rutas exactas están en `installation-result.json` de la entrega.
- La verificación visual interactiva quedó pendiente: el navegador integrado falla al iniciar la conexión en esta sesión.

Para ver los cambios, iniciar o reiniciar la API local y abrir el frontend. Facturación, Mercado Pago y el resto de las etapas no forman parte de este cambio.
