import { normalizeCargo } from '@/utils/auth.js'

export const EMPLOYEE_CARGO_PERMISSIONS = {
  'atencion al cliente': {
    label: 'Atencion al Cliente',
    summary: 'Gestiona la atencion presencial, reclamos, turnos y solicitudes recibidas en oficina.',
    routes: [
      {
        to: '/empleado/turnos',
        label: 'Turnos',
        description: 'Organiza turnos de atencion y consulta solicitudes de agenda.',
        status: 'planned'
      },
      {
        to: '/empleado/reclamos',
        label: 'Reclamos',
        description: 'Registra reclamos recibidos en oficina y deriva casos al sector correspondiente.',
        status: 'planned'
      },
      {
        to: '/empleado/solicitudes-servicio',
        label: 'Solicitudes',
        description: 'Revisa solicitudes de servicio y acompana el tramite administrativo.',
        status: 'planned'
      }
    ]
  },
  lecturista: {
    label: 'Lecturista',
    summary: 'Trabaja solamente con las hojas de ruta asignadas.',
    routes: [
      {
        to: '/empleado/hoja-ruta',
        label: 'Hoja de ruta',
        description: 'Inicia recorridos, carga mediciones asignadas y finaliza rutas con firma.',
        status: 'active'
      }
    ]
  },
  tecnico: {
    label: 'Tecnico',
    summary: 'Atiende instalaciones, revisiones tecnicas y solicitudes aprobadas.',
    routes: [
      { to: '/empleado/medidores', label: 'Medidores', description: 'Consulta fichas y registra movimientos de medidores.', status: 'active' },
      {
        to: '/empleado/solicitudes-tecnicas',
        label: 'Solicitudes tecnicas',
        description: 'Consulta solicitudes activas, estados y direcciones de instalacion.',
        status: 'active'
      },
      {
        to: '/empleado/instalaciones',
        label: 'Instalaciones',
        description: 'Consulta pendientes, instaladas y rechazadas; registra el resultado de la instalacion.',
        status: 'active'
      }
    ]
  },
  supervisor: {
    label: 'Supervisor',
    summary: 'Supervisa tareas operativas, rutas, reclamos y solicitudes.',
    routes: [
      {
        to: '/empleado/supervision',
        label: 'Supervision',
        description: 'Controla tareas de lecturistas y tecnicos antes del cierre operativo.',
        status: 'planned'
      },
      {
        to: '/empleado/rutas-medicion',
        label: 'Rutas de medicion',
        description: 'Revisa rutas asignadas, avance de recorridos e incidencias.',
        status: 'planned'
      },
      {
        to: '/empleado/reclamos',
        label: 'Reclamos operativos',
        description: 'Analiza reclamos que requieren seguimiento de campo.',
        status: 'planned'
      },
      {
        to: '/empleado/solicitudes-servicio',
        label: 'Solicitudes',
        description: 'Supervisa solicitudes y deriva tareas a los sectores correspondientes.',
        status: 'planned'
      }
    ]
  },
  cobrador: {
    label: 'Cobrador',
    summary: 'Gestiona cobranzas presenciales, pagos y consulta de facturas.',
    routes: [
      {
        to: '/empleado/cobranzas',
        label: 'Cobranzas',
        description: 'Registra pagos presenciales y controla deuda de socios.',
        status: 'planned'
      },
      {
        to: '/empleado/facturas',
        label: 'Facturas',
        description: 'Consulta facturas, estados de deuda e historial de comprobantes.',
        status: 'planned'
      },
      {
        to: '/empleado/pagos',
        label: 'Pagos',
        description: 'Controla pagos registrados y comprobantes emitidos.',
        status: 'planned'
      }
    ]
  },
  operador: {
    label: 'Operador',
    summary: 'Consulta servicios, medidores y tareas internas de operacion.',
    routes: [
      {
        to: '/empleado/operaciones',
        label: 'Operaciones',
        description: 'Centraliza tareas internas del servicio y seguimiento operativo.',
        status: 'planned'
      },
      {
        to: '/empleado/servicios',
        label: 'Servicios',
        description: 'Consulta servicios activos, altas, bajas y datos operativos.',
        status: 'planned'
      },
      {
        to: '/empleado/medidores',
        label: 'Medidores',
        description: 'Revisa medidores instalados y datos asociados al servicio.',
        status: 'planned'
      }
    ]
  },
  secretario: {
    label: 'Secretario',
    summary: 'Organiza turnos, comunicados y documentacion administrativa.',
    routes: [
      {
        to: '/empleado/turnos',
        label: 'Turnos',
        description: 'Organiza turnos y agenda administrativa de atencion.',
        status: 'planned'
      },
      {
        to: '/empleado/anuncios',
        label: 'Anuncios',
        description: 'Carga comunicados y novedades visibles para socios.',
        status: 'planned'
      },
      {
        to: '/empleado/documentacion',
        label: 'Documentacion',
        description: 'Gestiona documentacion administrativa interna.',
        status: 'planned'
      }
    ]
  },
  gerente: {
    label: 'Gerente',
    summary: 'Consulta indicadores, reportes y supervision general de la cooperativa.',
    routes: [
      {
        to: '/empleado/reportes',
        label: 'Reportes',
        description: 'Consulta reportes operativos y administrativos.',
        status: 'planned'
      },
      {
        to: '/empleado/supervision',
        label: 'Supervision',
        description: 'Revisa rendimiento de sectores y tareas pendientes.',
        status: 'planned'
      },
      {
        to: '/empleado/indicadores',
        label: 'Indicadores',
        description: 'Visualiza metricas generales para toma de decisiones.',
        status: 'planned'
      }
    ]
  },
  'soporte tecnico': {
    label: 'Soporte Tecnico',
    summary: 'Atiende problemas tecnicos del sistema e incidencias internas.',
    routes: [
      {
        to: '/empleado/soporte',
        label: 'Soporte',
        description: 'Registra y sigue problemas tecnicos reportados por usuarios.',
        status: 'planned'
      },
      {
        to: '/empleado/incidencias',
        label: 'Incidencias',
        description: 'Consulta incidencias internas y estado de resolucion.',
        status: 'planned'
      },
      {
        to: '/empleado/usuarios',
        label: 'Usuarios',
        description: 'Asiste usuarios y reporta fallas de acceso al equipo tecnico.',
        status: 'planned'
      }
    ]
  }
}

export function getEmployeePermissionByCargo(cargo) {
  return EMPLOYEE_CARGO_PERMISSIONS[normalizeCargo(cargo)] || null
}

export function getEmployeeRoutesByCargo(cargo) {
  return getEmployeePermissionByCargo(cargo)?.routes || []
}

export function canEmployeeAccessPath(cargo, pathname) {
  return getEmployeeRoutesByCargo(cargo).some((route) => pathname === route.to || pathname.startsWith(`${route.to}/`))
}

export function getEmployeeRouteMeta(pathname) {
  for (const permission of Object.values(EMPLOYEE_CARGO_PERMISSIONS)) {
    const route = permission.routes.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    if (route) {
      return route
    }
  }

  return null
}
