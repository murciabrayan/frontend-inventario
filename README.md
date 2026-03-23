# Sistema de Inventario Frontend

Frontend administrativo del sistema de inventario, construido con React, TypeScript y Vite.

## Stack

- React 19
- TypeScript
- Vite
- TanStack Query

## Modulos principales

- Login
- Dashboard
- Productos
- Categorias
- Movimientos
- Reportes
- Usuarios
- Perfil

## Funcionalidades

- Inicio de sesion con JWT
- Sidebar con modo colapsable
- Modales reutilizables para crear y editar
- Confirmaciones visuales para acciones sensibles
- Toasts de exito y error
- Filtros y paginacion
- Reportes con graficas
- Exportacion de reportes a PDF desde el navegador
- Cambio de contrasena con validaciones visuales

## Variables de entorno

Crea un archivo `.env` opcional:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Instalacion

```powershell
npm install
```

## Desarrollo

```powershell
npm run dev
```

## Build

```powershell
npm run build
```

## Estructura

```text
src/
  api.ts
  App.tsx
  components.tsx
  confirm.tsx
  toast.tsx
  types.ts
  pages/
```

## Credenciales demo

- Email: `admin@inventario.com`
- Password: `Admin12345!`

## Estado

Proyecto listo para demostracion de portafolio y conectado a un backend Django REST con autenticacion JWT.
