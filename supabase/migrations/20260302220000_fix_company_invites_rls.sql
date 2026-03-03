-- Asegurar que la tabla existe (idempotente)
CREATE TABLE IF NOT EXISTS company_invites (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;

-- Policy: INSERT
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON company_invites;
CREATE POLICY "Enable insert for authenticated users"
ON company_invites
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: SELECT
DROP POLICY IF EXISTS "Enable select for authenticated users" ON company_invites;
CREATE POLICY "Enable select for authenticated users"
ON company_invites
FOR SELECT
TO authenticated
USING (true);

-- Policy: UPDATE
DROP POLICY IF EXISTS "Enable update for authenticated users" ON company_invites;
CREATE POLICY "Enable update for authenticated users"
ON company_invites
FOR UPDATE
TO authenticated
USING (true);

-- Policy: DELETE
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON company_invites;
CREATE POLICY "Enable delete for authenticated users"
ON company_invites
FOR DELETE
TO authenticated
USING (true);
