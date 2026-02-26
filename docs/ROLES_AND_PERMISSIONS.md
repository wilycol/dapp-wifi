# Roles y Permisos

El sistema utiliza un control de acceso basado en roles (RBAC) simplificado, gestionado a través de la tabla `profiles`.

## Roles Definidos

| Rol | Alcance | Descripción |
| :--- | :--- | :--- |
| **SuperAdmin** | Global | Administrador del sistema SaaS. Tiene acceso total a todas las empresas, configuración global y métricas de plataforma. |
| **Admin** | Tenant (Empresa) | Dueño o administrador de un ISP. Gestiona usuarios, facturación de su empresa y configuración del negocio. |
| **Cobros** | Tenant (Empresa) | Personal administrativo. Enfocado en la gestión de clientes, facturación y pagos. Acceso limitado a configuración técnica. |
| **Tecnico** | Tenant (Empresa) | Personal de campo. Acceso enfocado en tickets de soporte e instalaciones. Vista limitada de datos financieros. |

## Matriz de Permisos

| Acción / Módulo | SuperAdmin | Admin | Cobros | Tecnico |
| :--- | :---: | :---: | :---: | :---: |
| **Gestión de Empresas** | ✅ Total | ❌ | ❌ | ❌ |
| **Usuarios (Staff)** | ✅ | ✅ Crear/Editar | 👁️ Ver | ❌ |
| **Clientes** | ✅ | ✅ Total | ✅ Total | 👁️ Ver (Asignados) |
| **Instaladores** | ✅ | ✅ Total | 👁️ Ver | ❌ |
| **Tickets Soporte** | ✅ | ✅ Total | ✅ Crear/Ver | ✅ Resolver |
| **Configuración Pago** | ✅ | ✅ | ❌ | ❌ |
| **Reportes Financieros**| ✅ | ✅ | ✅ | ❌ |

## Implementación Técnica

La verificación de roles se realiza en dos niveles:

1.  **Base de Datos (RLS)**: Políticas que restringen el acceso a filas según el `company_id`.
2.  **Frontend (UI)**: Componentes protegidos que ocultan opciones según el rol.

```typescript
// Ejemplo de verificación en Frontend
if (profile.role === 'Tecnico') {
  // Ocultar botón de facturación
}
```
