BEGIN;

-- 1. Asegurar que existe la empresa por defecto para migración
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Empresa Demo WiFi') THEN
        INSERT INTO companies (name, plan, slug, is_active) VALUES ('Empresa Demo WiFi', 'basic', 'empresa-demo-wifi', true);
    END IF;
END $$;

-- 2. Modificar tabla 'clients'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Migrar datos existentes
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo WiFi' LIMIT 1)
WHERE company_id IS NULL;

-- Hacer obligatoria la columna
ALTER TABLE clients ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);


-- 3. Modificar tabla 'installers'
ALTER TABLE installers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Migrar datos existentes
UPDATE installers 
SET company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo WiFi' LIMIT 1)
WHERE company_id IS NULL;

-- Hacer obligatoria la columna
ALTER TABLE installers ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_installers_company_id ON installers(company_id);


-- 4. Modificar tabla 'support_tickets'
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Migrar datos existentes
UPDATE support_tickets 
SET company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo WiFi' LIMIT 1)
WHERE company_id IS NULL;

-- Hacer obligatoria la columna
ALTER TABLE support_tickets ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON support_tickets(company_id);


-- 5. Actualizar Políticas RLS (Row Level Security)

-- Eliminar políticas antiguas (permisivas)
DROP POLICY IF EXISTS "Allow all access to clients" ON clients;
DROP POLICY IF EXISTS "Allow all access to installers" ON installers;
DROP POLICY IF EXISTS "Allow all access to support_tickets" ON support_tickets;

-- Asegurar que RLS está habilitado
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Definir Nuevas Políticas de Aislamiento
-- Regla: El usuario solo puede ver/editar datos donde company_id coincida con su perfil
-- Excepción: SuperAdmin puede ver todo

-- Policy for Clients
CREATE POLICY "Tenant Isolation Policy for Clients" ON clients
    FOR ALL
    USING (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SuperAdmin'
    )
    WITH CHECK (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SuperAdmin'
    );

-- Policy for Installers
CREATE POLICY "Tenant Isolation Policy for Installers" ON installers
    FOR ALL
    USING (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SuperAdmin'
    )
    WITH CHECK (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SuperAdmin'
    );

-- Policy for Support Tickets
CREATE POLICY "Tenant Isolation Policy for Support Tickets" ON support_tickets
    FOR ALL
    USING (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SuperAdmin'
    )
    WITH CHECK (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SuperAdmin'
    );

COMMIT;
