const { createClient } = require('./db-client');

async function fixRLSAndAddOwner() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos...');

    // 0. Agregar columna owner_id y slug a companies
    console.log('📦 Agregando columna owner_id y slug a companies...');
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS slug text;
      
      -- Opcional: Agregar FK si users está en public, pero auth.users está en schema auth,
      -- normalmente no se hace FK estricta a auth.users desde public por permisos, pero es buena práctica.
      -- Por simplicidad y evitar errores de permisos cross-schema ahora, lo dejamos como uuid simple.
    `);

    // 1. Companies - Permitir INSERT a usuarios autenticados
    console.log('🛡️ Aplicando políticas RLS a companies...');
    await client.query(`
      ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
      
      -- Eliminar política si existe para evitar duplicados
      DROP POLICY IF EXISTS "Users can create companies" ON companies;
      
      -- Crear política de INSERT: Permitir si eres autenticado.
      -- Nota: La validación de que el owner_id seas tú se puede hacer en el check.
      CREATE POLICY "Users can create companies" 
      ON companies 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = owner_id);

      -- Crear política de SELECT (Ver su propia compañía basada en owner_id)
      -- Esto resuelve el problema de "ver lo que acabo de insertar" antes de actualizar el profile.
      DROP POLICY IF EXISTS "Users can view owned company" ON companies;
      CREATE POLICY "Users can view owned company" 
      ON companies 
      FOR SELECT 
      TO authenticated 
      USING (
        auth.uid() = owner_id 
        OR 
        id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      );
      
      -- Permitir UPDATE si eres el owner o admin
      DROP POLICY IF EXISTS "Owners can update company" ON companies;
      CREATE POLICY "Owners can update company"
      ON companies
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = owner_id OR id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    `);

    // 2. Profiles - Permitir UPDATE de company_id
    console.log('🛡️ Aplicando políticas RLS a profiles...');
    await client.query(`
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      CREATE POLICY "Users can update their own profile" 
      ON profiles 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
      
      -- Asegurar SELECT
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      CREATE POLICY "Users can view their own profile" 
      ON profiles 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = id);
    `);
    
    // 3. Service Requests - Permitir INSERT
    console.log('🛡️ Aplicando políticas RLS a service_requests...');
    await client.query(`
        ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can create requests" ON service_requests;
        CREATE POLICY "Users can create requests"
        ON service_requests
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    `);

    // 4. Company Invites - Permitir INSERT
     console.log('🛡️ Aplicando políticas RLS a company_invites...');
    await client.query(`
        ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can create invites" ON company_invites;
        CREATE POLICY "Users can create invites"
        ON company_invites
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    `);

    console.log('✅ Políticas RLS y columna owner_id aplicadas exitosamente.');

  } catch (err) {
    console.error('❌ Error al aplicar cambios:', err);
  } finally {
    await client.end();
  }
}

fixRLSAndAddOwner();
