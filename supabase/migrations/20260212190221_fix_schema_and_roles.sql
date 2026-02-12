BEGIN;

-- 1. Crear tabla de Empresas si no existe
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subscription_plan TEXT DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar que la tabla profiles tenga las columnas necesarias
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Cobros', 'Tecnico', 'SuperAdmin')),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar empresa demo
INSERT INTO companies (name) VALUES ('Empresa Demo WiFi') ON CONFLICT DO NOTHING;

-- 4. Función para auto-asignar rol al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT id INTO v_company_id FROM companies WHERE name = 'Empresa Demo WiFi' LIMIT 1;
    
    INSERT INTO public.profiles (id, email, role, company_id)
    VALUES (
        NEW.id, 
        NEW.email, 
        CASE WHEN NEW.email = 'wilycol1492@gmail.com' THEN 'SuperAdmin' ELSE 'Tecnico' END,
        v_company_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

COMMIT;
