-- Script SQL DEFINITIVO para alinear a Paula con el Admin real (defilyv1qa)
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Variables de Identificación (Confirmadas por script de diagnóstico)
-- Admin Real (defilyv1qa@gmail.com): ID '99406f14-eba7-40db-b1a4-4d6f485a0186'
-- Company del Admin Real: 'b28b1c5c-68b0-40a1-aac6-1b4cd1f79ff0'
-- Paula (paula.garcia812002@gmail.com): ID '3d51d8bd-482a-4da7-a1c5-b02b85d8732e'

-- 2. Mover a Paula a la compañía correcta (la del Admin)
UPDATE public.profiles
SET company_id = 'b28b1c5c-68b0-40a1-aac6-1b4cd1f79ff0'
WHERE id = '3d51d8bd-482a-4da7-a1c5-b02b85d8732e';

-- 3. Actualizar/Insertar a Paula en la tabla installers con la compañía correcta
INSERT INTO public.installers (id, name, email, phone, status, company_id)
VALUES (
  '3d51d8bd-482a-4da7-a1c5-b02b85d8732e',
  'Paula García',
  'paula.garcia812002@gmail.com',
  NULL, -- Phone no disponible en perfil, usar NULL
  'Disponible',
  'b28b1c5c-68b0-40a1-aac6-1b4cd1f79ff0'
)
ON CONFLICT (id) DO UPDATE
SET 
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- 4. Insertar/Actualizar al Admin en la tabla installers (para que se vea a sí mismo)
INSERT INTO public.installers (id, name, email, phone, status, company_id)
VALUES (
  '99406f14-eba7-40db-b1a4-4d6f485a0186',
  'Admin (defilyv1qa)',
  'defilyv1qa@gmail.com',
  NULL,
  'Disponible',
  'b28b1c5c-68b0-40a1-aac6-1b4cd1f79ff0'
)
ON CONFLICT (id) DO UPDATE
SET 
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- 5. Verificar y limpiar registros huérfanos (Opcional pero recomendado)
-- Eliminar registros en installers que tengan la compañía antigua '470bd945...' si ya no son necesarios
-- (Solo si estamos seguros de que esa compañía era incorrecta/temporal)
-- DELETE FROM public.installers WHERE company_id = '470bd945-3e8f-426a-a8a3-64a1c15e1c35';
