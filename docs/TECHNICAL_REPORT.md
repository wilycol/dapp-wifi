# Informe Técnico Descriptivo: Dapp-WiFi SaaS

## 1. Visión General del Proyecto
**Dapp-WiFi** es una plataforma SaaS (Software as a Service) diseñada para la gestión de Proveedores de Servicios de Internet (ISPs y WISPs). Permite a múltiples empresas gestionar sus clientes, instaladores, tickets de soporte y facturación de manera centralizada pero aislada.

## 2. Stack Tecnológico
- **Frontend**: Next.js 15.1.7 (App Router), React 19, Tailwind CSS, Lucide React.
- **Backend/Database**: Supabase (PostgreSQL 15+), Auth, Realtime, Storage.
- **Lenguaje**: TypeScript.
- **Despliegue**: Vercel.
- **Pagos**: Paddle (Integración planificada).

## 3. Arquitectura Multi-Tenant
El sistema utiliza una arquitectura **Multi-Tenant con Base de Datos Compartida (Shared Database, Shared Schema)**, donde el aislamiento lógico se logra mediante una columna discriminadora (`company_id`) en cada tabla sensible.

### 3.1 Modelo de Datos
- **Tabla `companies`**: Entidad raíz que representa a cada ISP/WISP.
- **Tablas Hijas (`clients`, `installers`, `support_tickets`)**: Todas tienen una clave foránea `company_id` obligatoria que referencia a `companies(id)`.
- **Tabla `profiles`**: Vincula a los usuarios (Auth) con una empresa específica mediante `company_id`.

### 3.2 Seguridad y Aislamiento (RLS)
La seguridad se garantiza a nivel de base de datos utilizando **Row Level Security (RLS)** de PostgreSQL. Ninguna consulta puede acceder a datos de otra empresa, independientemente de la lógica del frontend.

**Política Estándar de Aislamiento:**
```sql
CREATE POLICY "Tenant Isolation Policy" ON table_name
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
```
Esta política asegura que un usuario solo pueda ver, editar o eliminar registros que pertenezcan a la misma empresa que su perfil.

## 4. Roles y Permisos
El sistema implementa un control de acceso basado en roles (RBAC) simplificado dentro del contexto de cada tenant.
- **SuperAdmin**: Acceso global (puede gestionar múltiples empresas o la plataforma en sí).
- **Admin**: Acceso total dentro de su propia empresa (gestión de usuarios, configuración).
- **Técnico**: Acceso limitado a tickets asignados e información técnica de clientes.
- **Cobros**: Acceso limitado a facturación y estados de cuenta.

Los roles se almacenan en la tabla `profiles` columna `role`.

## 5. Flujo de Autenticación
1. Usuario se autentica con Supabase Auth (Email/Password o Magic Link).
2. Se genera un JWT con el `sub` (UUID del usuario).
3. El frontend consulta la tabla `profiles` para obtener el `company_id` y `role`.
4. Todas las peticiones subsiguientes a la base de datos incluyen el JWT.
5. Postgres utiliza el JWT para evaluar las políticas RLS automáticamente.

## 6. Estado Actual de la Base de Datos
La base de datos ha sido migrada exitosamente para soportar el modelo Multi-Tenant.
- Tablas críticas (`clients`, `installers`, `support_tickets`) tienen `company_id`.
- RLS está habilitado y verificado en todas las tablas sensibles.
- Se han corregido inconsistencias previas (tablas faltantes, columnas renombradas).
