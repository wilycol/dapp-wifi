const { createClient } = require('./db-client');

async function fixCompanyInvitesRLS() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos...');

    console.log('🛠️ Verificando y creando tabla company_invites si no existe...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_invites (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        company_id uuid REFERENCES companies(id) NOT NULL,
        email text NOT NULL,
        role text NOT NULL,
        status text DEFAULT 'pending',
        created_at timestamptz DEFAULT now()
      );
    `);

    console.log('🛡️ Aplicando políticas RLS a company_invites...');
    
    // Habilitar RLS
    await client.query(`ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;`);

    // Policy: INSERT
    console.log(' - Aplicando política de INSERT...');
    await client.query(`
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON company_invites;
      CREATE POLICY "Enable insert for authenticated users"
      ON company_invites
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
    `);

    // Policy: SELECT
    console.log(' - Aplicando política de SELECT...');
    await client.query(`
      DROP POLICY IF EXISTS "Enable select for authenticated users" ON company_invites;
      CREATE POLICY "Enable select for authenticated users"
      ON company_invites
      FOR SELECT
      TO authenticated
      USING (true);
    `);

    // Policy: UPDATE
    console.log(' - Aplicando política de UPDATE...');
    await client.query(`
      DROP POLICY IF EXISTS "Enable update for authenticated users" ON company_invites;
      CREATE POLICY "Enable update for authenticated users"
      ON company_invites
      FOR UPDATE
      TO authenticated
      USING (true);
    `);

    // Policy: DELETE
    console.log(' - Aplicando política de DELETE...');
    await client.query(`
      DROP POLICY IF EXISTS "Enable delete for authenticated users" ON company_invites;
      CREATE POLICY "Enable delete for authenticated users"
      ON company_invites
      FOR DELETE
      TO authenticated
      USING (true);
    `);

    console.log('✅ Políticas RLS aplicadas exitosamente a company_invites.');

  } catch (err) {
    console.error('❌ Error al aplicar políticas RLS:', err);
  } finally {
    await client.end();
  }
}

fixCompanyInvitesRLS();
