BEGIN;

-- 1. Actualizar Enums para que coincidan con la propuesta Dapp
ALTER TYPE client_status RENAME VALUE 'Pendiente' TO 'En Mora';
ALTER TYPE client_status RENAME VALUE 'Inactivo' TO 'Cortado';

-- 2. Añadir campos técnicos y financieros a la tabla de clientes
ALTER TABLE clients 
ADD COLUMN contract_number TEXT,
ADD COLUMN ip_mac TEXT,
ADD COLUMN monthly_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN due_date INTEGER DEFAULT 5; -- Día del mes que vence (ej: 5)

-- 3. Añadir tabla de roles (opcional para lógica futura, pero definimos el campo en perfiles si fuera necesario)
-- Por ahora, añadiremos una columna de rol a una tabla de perfiles o usaremos metadatos.
-- Para este MVP, simularemos los roles en el frontend basándonos en el usuario.

COMMIT;