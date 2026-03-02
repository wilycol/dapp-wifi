const { createClient } = require('./db-client');

async function setupStorage() {
  const client = createClient();
  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos...');

    // 1. Create 'logos' bucket if not exists
    console.log('🪣 Creando bucket "logos"...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('logos', 'logos', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Enable RLS on objects if not already
    // await client.query(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);

    // 3. Create policies (using DO block to avoid errors if they exist)
    console.log('🔓 Configurando políticas de acceso...');
    
    // Public Read
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'objects' AND policyname = 'Public Access Logos'
        ) THEN
          CREATE POLICY "Public Access Logos"
          ON storage.objects FOR SELECT
          USING ( bucket_id = 'logos' );
        END IF;
      END
      $$;
    `);

    // Authenticated Upload
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Logos'
        ) THEN
          CREATE POLICY "Authenticated Upload Logos"
          ON storage.objects FOR INSERT
          WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
        END IF;
      END
      $$;
    `);

    console.log('✅ Storage "logos" configurado exitosamente.');

  } catch (err) {
    console.error('❌ Error al configurar storage:', err);
  } finally {
    await client.end();
  }
}

setupStorage();
