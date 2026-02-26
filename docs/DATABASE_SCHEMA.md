# Esquema de Base de Datos

Este documento describe la estructura de datos para el sistema de gestión WISP.

## Tablas Principales

### `companies` (Tenants)
Representa a cada empresa ISP que utiliza el software.
- `id` (UUID, PK): Identificador único.
- `name` (Text): Nombre de la empresa.
- `subscription_status` (Text): Estado en Paddle ('active', 'past_due', etc.).
- `created_at` (Timestamp).

### `profiles` (Usuarios)
Extension del usuario de Supabase Auth.
- `id` (UUID, PK): Vinculado a `auth.users.id`.
- `company_id` (UUID, FK): Referencia a `companies.id`.
- `role` (Text): Rol del usuario ('SuperAdmin', 'Admin', 'Cobros', 'Tecnico').
- `email` (Text).

### `clients` (Clientes Finales)
Clientes de los ISPs.
- `id` (UUID, PK).
- `company_id` (UUID, FK): Tenant dueño del cliente.
- `full_name` (Text).
- `dni` (Text).
- `address` (Text).
- `plan` (Text): Plan de internet contratado.
- `monthly_rate` (Decimal): Costo mensual.
- `status` (Text): 'Activo', 'Suspendido', 'Cancelado'.
- `ip_address` (Inet): Dirección IP asignada.

### `installers` (Técnicos)
Personal de campo.
- `id` (UUID, PK).
- `company_id` (UUID, FK).
- `name` (Text).
- `phone` (Text).
- `status` (Text): 'Activo', 'Inactivo'.

### `support_tickets` (Soporte)
Incidencias reportadas.
- `id` (UUID, PK).
- `company_id` (UUID, FK).
- `client_id` (UUID, FK): Cliente afectado.
- `title` (Text).
- `description` (Text).
- `priority` (Text): 'Baja', 'Media', 'Alta'.
- `status` (Text): 'Abierto', 'En Progreso', 'Cerrado'.
- `assigned_to` (UUID, FK): Técnico asignado (opcional).

## Seguridad (Row Level Security - RLS)

Todas las tablas tienen RLS habilitado.

### Política General de Aislamiento
```sql
-- Ejemplo para tabla clients
CREATE POLICY "Tenant Isolation" ON clients
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

### Excepción SuperAdmin
Los usuarios con rol `SuperAdmin` tienen acceso a todos los datos para tareas de mantenimiento global (si se requiere).
