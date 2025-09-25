# Cooperativa Portal Web

Portal web para cooperativa de agua y luz desarrollado con Nuxt 3.

## Características

- 🎯 **Interfaz intuitiva** diseñada para personas mayores
- 👥 **Dos tipos de usuarios**: Administradores y Socios
- 📱 **Responsive design** que funciona en todos los dispositivos
- 🎥 **Video tutorial** en la página de inicio
- 📚 **Centro de ayuda** completo con guías paso a paso
- 🔐 **Sistema de autenticación** seguro
- 💳 **Gestión de facturas** y pagos
- 📊 **Panel de administración** completo

## Estructura del Proyecto

```
cooperativa/
├── assets/
│   └── css/
│       └── main.css          # Estilos principales con Tailwind
├── components/               # Componentes reutilizables
├── layouts/
│   ├── default.vue          # Layout principal
│   └── auth.vue             # Layout para páginas de autenticación
├── middleware/
│   ├── auth.ts              # Middleware de autenticación
│   └── admin.ts             # Middleware de administrador
├── pages/
│   ├── index.vue            # Página de inicio
│   ├── login.vue            # Página de login
│   ├── register.vue         # Página de registro
│   ├── socio/
│   │   └── index.vue        # Dashboard del socio
│   ├── admin/
│   │   └── index.vue        # Dashboard del administrador
│   └── ayuda/
│       └── index.vue         # Centro de ayuda
├── server/
│   └── api/
│       └── auth/
│           ├── login.post.ts    # API de login
│           └── register.post.ts # API de registro
├── stores/
│   ├── auth.ts              # Store de autenticación
│   ├── app.ts                # Store de la aplicación
│   └── cooperative.ts        # Store de datos de la cooperativa
├── nuxt.config.ts           # Configuración de Nuxt
└── package.json             # Dependencias del proyecto
```

## Tecnologías Utilizadas

- **Nuxt 3** - Framework de Vue.js
- **Tailwind CSS** - Framework de CSS
- **Pinia** - Gestión de estado
- **Lucide Vue** - Iconos
- **TypeScript** - Tipado estático

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## Usuarios de Prueba

### Socio
- **Email**: socio@demo.com
- **Contraseña**: 123456

### Administrador
- **Email**: admin@demo.com
- **Contraseña**: 123456

## Características de Accesibilidad

- ✅ Texto grande y legible
- ✅ Botones grandes y fáciles de presionar
- ✅ Colores contrastantes
- ✅ Navegación intuitiva
- ✅ Iconos descriptivos
- ✅ Guías paso a paso
- ✅ Centro de ayuda completo

## Funcionalidades por Usuario

### Para Socios
- Ver servicios activos (agua y luz)
- Consultar facturas pendientes
- Pagar facturas en línea
- Ver historial de pagos
- Reportar problemas
- Acceder al centro de ayuda

### Para Administradores
- Gestionar socios
- Configurar servicios
- Registrar lecturas de medidores
- Generar facturas
- Gestionar pagos
- Crear anuncios
- Generar reportes
- Ver actividad reciente

## Próximos Pasos

- [ ] Implementar video tutorial real
- [ ] Conectar con API real
- [ ] Agregar más funcionalidades de pago
- [ ] Implementar notificaciones push
- [ ] Agregar más reportes y estadísticas
- [ ] Optimizar para dispositivos móviles
- [ ] Implementar sistema de tickets de soporte
