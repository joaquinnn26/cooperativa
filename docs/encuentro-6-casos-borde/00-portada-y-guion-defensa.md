# Cooperativa de Agua y Luz

## Encuentro 6 - Casos borde

### Pregunta eje

**Que pasa cuando algo sale mal?**

### Integrantes

- Completar.

### Cliente

- Cooperativa: completar nombre.
- Localidad: completar.

### Fecha

- Completar fecha de entrega.

---

## Guion de defensa

### 1. Introduccion

El sistema no fue analizado solo desde los formularios. Se revisaron los estados persistidos, los controladores de la API, las validaciones del frontend, las relaciones de base de datos y los efectos secundarios de cada operacion.

### 2. Entidades principales

Las maquinas de estado principales son:

- Solicitudes de servicio.
- Reclamos.
- Turnos.
- Facturas.
- Rutas de medicion y sus detalles.
- Anuncios.
- Socios, empleados, medidores y servicios asignados como estados activo/inactivo.

### 3. Casos borde mas importantes

- Dos socios intentan reservar el mismo turno.
- Una lectura es menor que la anterior.
- Un lecturista intenta cargar una ruta ajena.
- Una ruta se intenta finalizar incompleta o sin firma.
- Se intenta aprobar dos veces una solicitud.
- Se intenta revertir una factura pagada.
- Un usuario modifica su rol en el navegador.
- Un anuncio tiene fechas incoherentes o prioridad inexistente.

### 4. Que rechaza correctamente el sistema

- Turnos pasados, en fin de semana, fuera de horario u ocupados.
- Lecturas negativas o menores a la anterior.
- Medidores inactivos o ajenos a la ruta.
- Rutas incompletas, cerradas o sin firma.
- Documentos con tipo no permitido.
- Anuncios con campos, fechas o prioridad invalidos.
- Empleados inactivos durante el login.

### 5. Que todavia debe mejorarse

- Aplicar autenticacion y roles en la API.
- Restringir transiciones de solicitudes, reclamos y turnos.
- Implementar pagos reales.
- Implementar recuperacion y cambio de contrasena.
- Automatizar pruebas.
- Evitar exponer excepciones internas.

### 6. Gestion

El Sprint 4 esta reconstruido con historias y criterios verificables. La retrospectiva registra tanto avances como errores reales. Las decisiones que dependen de la cooperativa se dejaron en un acta de validacion, sin presentarlas falsamente como aprobadas.

### 7. Cierre

El sistema resuelve gran parte de la operacion real, pero la conclusion del analisis es que un producto para uso comunitario no debe depender solo de que la interfaz oculte acciones. Las reglas criticas deben existir en la API, quedar probadas y conservar trazabilidad.

## Checklist previo a entregar

- [ ] Completar integrantes, cliente y fecha.
- [ ] Renderizar o capturar los diagramas Mermaid.
- [ ] Ejecutar las pruebas prioritarias.
- [ ] Adjuntar evidencias sin datos sensibles.
- [ ] Realizar la reunion con la cooperativa.
- [ ] Firmar o aprobar el acta de decisiones.
- [ ] Registrar fallas y repruebas.
- [ ] Revisar ortografia y formato solicitado por la catedra.

