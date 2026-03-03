
-- Script SQL CORREGIDO v2 (Soluciona error "record new has no field phone")
-- Ejecutar TODO este contenido en Supabase Dashboard > SQL Editor

-- 1. PRIMERO: Corregir la función del trigger que está causando el error
-- Esta función se dispara automáticamente al actualizar profiles.
-- La versión anterior fallaba porque buscaba 'phone' en profiles, que no existe.
CREATE OR REPLACE FUNCTION public.sync_technician_to_installers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar si el usuario es técnico
  IF NEW.role = 'tecnico' THEN
    INSERT INTO public.installers (id, name, email, phone, status, company_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, NEW.email, 'Técnico'),
      NEW.email, 
      NULL,      -- CORRECCIÓN CRÍTICA: Enviamos NULL porque 'phone' no existe en profiles
      'Disponible',
      NEW.company_id
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      company_id = EXCLUDED.company_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Asegurar que la tabla profiles tenga la columna email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 3. Actualizar la compañía de Paula (Ahora funcionará porque el trigger está arreglado)
-- ID de Paula: 3d51d8bd-482a-4da7-a1c5-b02b85d8732e
-- Company ID del Admin: 470bd945-3e8f-426a-a8a3-64a1c15e1c35
UPDATE public.profiles
SET company_id = '470bd945-3e8f-426a-a8a3-64a1c15e1c35'
WHERE id = '3d51d8bd-482a-4da7-a1c5-b02b85d8732e';

-- 4. Asegurar registro de Paula en installers
INSERT INTO public.installers (id, name, status, company_id)
VALUES (
  '3d51d8bd-482a-4da7-a1c5-b02b85d8732e',
  'Paula García',
  'Disponible',
  '470bd945-3e8f-426a-a8a3-64a1c15e1c35'
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  company_id = EXCLUDED.company_id;

-- 5. Asegurar registro del Admin en installers
INSERT INTO public.installers (id, name, status, company_id)
VALUES (
  '97807d28-5bca-475e-80f3-b7f40ed9f3c5',
  'Administrador',
  'Disponible',
  '470bd945-3e8f-426a-a8a3-64a1c15e1c35'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Re-aplicar política de seguridad RLS unificada
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for company members" ON installers;
CREATE POLICY "Enable read access for company members" ON installers
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );
