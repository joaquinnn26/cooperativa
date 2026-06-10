# Cooperativa Portal Web

Portal web para una cooperativa de agua y luz desarrollado con React, Vite y Tailwind CSS.

## Tecnologias

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Zustand
- Lucide React
- SweetAlert2

## Instalacion

```bash
npm install
npm run dev
```

URL local por defecto:

```text
http://localhost:5173
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Estructura principal

```text
src/
  App.jsx                         Rutas principales de la SPA
  components/                     Componentes reutilizables
  config/api.js                   Configuracion de URL de API
  features/
    socio/                        Pantallas, servicios y helpers del socio
    admin/                        Pantallas y servicios del administrador
    auth/                         Login, registro y recuperacion
  hooks/                          Hooks reutilizables
  store/                          Estado global con Zustand
  utils/                          Utilidades generales
```

## Modulo de turnos

El flujo de turnos esta documentado en:

```text
docs/turnos-rubrica.md
```

Archivos principales:

- `src/features/socio/pages/MisTurnos.jsx`
- `src/features/admin/pages/AdminTurnos.jsx`
- `src/hooks/useTurnos.jsx`
- `src/hooks/useAdminTurnos.jsx`
- `src/utils/turnosUtils.jsx`
- `src/store/turnosLocalStore.jsx`

## Resumen del flujo de turnos

1. El socio entra a Mis turnos y abre el modal de nuevo turno.
2. El sistema consulta disponibilidad dentro del modal.
3. El formulario valida dia, horario y motivo.
4. Se crea el turno en estado pendiente.
5. El administrador puede aprobar, proponer otro horario o rechazar.
6. Si hay propuesta, el socio puede aceptarla.
7. La interfaz muestra busqueda, filtros, paginacion, modales, confirmaciones y notificaciones.
