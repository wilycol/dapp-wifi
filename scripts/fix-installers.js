const { Client } = require('pg');
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function fix() {
  await client.connect();
  
  // 1. Create installers table
  try {
      await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installer_status') THEN
                CREATE TYPE installer_status AS ENUM ('Disponible', 'En Ruta', 'Fuera de Servicio');
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS installers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            status installer_status DEFAULT 'Disponible',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
        
        -- Temporary permissive policy (will be replaced by multi-tenant one)
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installers' AND policyname = 'Allow all access to installers') THEN
                CREATE POLICY "Allow all access to installers" ON installers FOR ALL USING (true) WITH CHECK (true);
            END IF;
        END $$;
      `);
      console.log("✅ Created installers table");
  } catch (e) {
      console.error("❌ Error creating installers:", e);
  }

  await client.end();
}
fix();