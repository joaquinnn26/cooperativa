# Adhesiones a Sepelio y Ortopedia

La contratación mensual es voluntaria y se registra por separado del uso de una prestación. Esta implementación requiere el backend de la rama `Feature/Silvana` y su migración `20261016_AdhesionesBeneficios.sql`.

## Alta y cobertura

Al solicitar Energía se pueden elegir Sepelio, Ortopedia, ambos o ninguno. Los socios con una conexión eléctrica activa también pueden pedir la adhesión en **Sepelio y Ortopedia**. La revisión de la solicitud eléctrica continúa por su circuito existente.

Para Sepelio se eligen las personas que se desean cubrir: titular, familiares o ambos; no se exige incluir al titular ni a todo el grupo familiar. Se adjunta una copia del DNI por persona. Se admiten PDF, PNG o JPEG de hasta 2 MB por persona y 6 MB en total, con un máximo técnico de 15 personas por envío. En general viven en el domicilio declarado; los hijos que viven fuera de la localidad pueden declarar que mantienen la adhesión, condición que Administración debe comprobar antes de activar la cobertura.

Ortopedia no exige documentación adicional. Su cuota inicial se configuró en $1.000 por indicación de Silvana. Sepelio conserva la tarifa que ya tuviera el catálogo; no se tomaron importes de la foto de una factura como tarifas vigentes.

No se contratan servicios automáticamente por tener Energía. La adhesión empieza **En revisión**, sin cobertura ni cargo mensual activo. Administración verifica los datos, la conexión eléctrica y la condición de socio activo con medidor a su nombre antes de activarla. Se congela la tarifa vigente en la adhesión al activar. Los cambios futuros de tarifas necesitan una actualización explícita, no se reescriben las facturas anteriores.

Los estados de adhesión son `EnRevision`, `Observada`, `Activa`, `Rechazada` y `Baja`. El socio puede corregir una observación o pedir la baja. Cada cambio conserva un historial y se controla la revisión para evitar sobrescribir cambios simultáneos.

## Pedidos de atención

Solo una adhesión activa con cobertura vigente permite pedir una prestación. Para Sepelio se elige una persona de su cobertura; para Ortopedia se describe el elemento o atención necesaria sin volver a pedir DNI. El pedido no crea otra adhesión ni otra cuota.

Administración o personal autorizado registra la derivación y el resultado del prestador. Los estados son `Recibida`, `Derivada`, `Finalizada` y `Cancelada`. La descarga de Excel no equivale a un envío: debe registrarse la derivación cuando realmente se haya realizado. El sistema no envía correos ni mensajes automáticos al proveedor.

Los documentos se descargan desde la API con autenticación y control de titularidad o función laboral. No se guardan en localStorage ni se exponen mediante una URL pública. El Excel incluye los datos de la adhesión y las personas seleccionadas; las copias del DNI se descargan por separado. El modelo del archivo debe acordarse con el prestador antes de usarlo operativamente.

## Facturación

En **Facturación externa** se puede exportar el TXT con **Incluir cuotas de Sepelio y Ortopedia**, usando el formato `SOCIOAPP-2`. El formato anterior `SOCIOAPP-1` sigue disponible para los intercambios previos sin detalle de conceptos.

`SOCIOAPP-2` conserva los identificadores existentes y agrega la columna final `ConceptosJson`. La exportación incluye una copia de las cuotas de la conexión eléctrica para el período. Se selecciona la última adhesión activada de cada tipo que se superponga al mes. No se calcula prorrateo, impuestos ni vencimientos: los define el sistema contable. Si hay varias mediciones para una conexión en el período, se rechaza la exportación con cuotas hasta revisar la consolidación para evitar repetir cargos.

La respuesta contable tiene estas columnas, separadas por tabuladores:

```text
FormatoVersion SOCIOAPP-2
CodigoFacturaExterno IdLoteExportacion IdMedicion IdServicioSocio NumeroSocio Periodo Monto FechaEmision FechaVencimiento LinkPago ConceptosJson
```

En el archivo real los espacios entre columnas se reemplazan por tabuladores; la primera línea tiene un tabulador entre `FormatoVersion` y `SOCIOAPP-2`. Las fechas usan `yyyy-MM-dd` y los importes punto decimal sin separador de miles.

Ejemplo ficticio de la columna JSON:

```json
[{"Tipo":"SEPELIO","Descripcion":"Servicio de Sepelio","Importe":2500},{"Tipo":"ORTOPEDIA","Descripcion":"Servicio de Ortopedia","Importe":1000}]
```

Se validan las cuotas contra la copia exportada, los conceptos obligatorios del padrón, los códigos externos y las conexiones y períodos duplicados. Para descuentos u otros conceptos se admite `Tipo: "OTRO"` con importe positivo o negativo. El detalle queda almacenado y se muestra en **Mis facturas**, dentro de **Otros servicios / conceptos**. El monto importado ya debe contener esos conceptos: nunca se vuelven a sumar al total. El enlace de pago sigue siendo el informado por contabilidad; abrirlo no confirma un pago.

Esta pantalla muestra el detalle importado; no reproduce gráficamente la factura fiscal de la cooperativa ni emite un comprobante fiscal.

## Integración y verificación

Frontend y API deben integrarse juntos. Aplicar primero la migración del backend en el ambiente correspondiente y compilar/publicar la API. La migración no incorpora datos personales de la factura adjunta ni transforma solicitudes anteriores en adhesiones; los servicios contratados previamente necesitan una conciliación explícita para evitar cobertura o cargos duplicados.

Pruebas del frontend: `node --test tests/adhesiones.test.js`.

Las pruebas de API se encuentran en `tests/Run-AdhesionesTests.ps1` del repositorio backend. Sus registros de prueba se crean dentro de una transacción que se revierte. Ejecutarlas solo contra una base de pruebas con las migraciones previas instaladas.

La API local está configurada para el origen `http://localhost:5173`. Para probar el acceso usá ese puerto; no se modificó la configuración de autenticación.
