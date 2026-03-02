const { createClient } = require('./db-client');

async function applySchema() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos...');

    // 1. Agregar columnas a la tabla companies
    console.log('📦 Actualizando tabla companies...');
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS fiscal_id text,
      ADD COLUMN IF NOT EXISTS address text,
      ADD COLUMN IF NOT EXISTS phone text,
      ADD COLUMN IF NOT EXISTS email text,
      ADD COLUMN IF NOT EXISTS website text,
      ADD COLUMN IF NOT EXISTS logo_url text,
      ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
    `);

    // 1.5 Agregar monthly_amount a clients (Fix pendiente)
    console.log('💰 Actualizando tabla clients (monthly_amount)...');
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS monthly_amount numeric DEFAULT 0;
    `);

    // 2. Asegurar que profiles tenga company_id
    console.log('👤 Verificando tabla profiles...');
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
    `);

    // 3. Crear tabla para invitaciones de equipo
    console.log('💌 Creando tabla company_invites...');
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

    // 4. Crear tabla para solicitudes de servicios (ej. Página Web)
    console.log('🛠️ Creando tabla service_requests...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        company_id uuid REFERENCES companies(id) NOT NULL,
        request_type text NOT NULL,
        details jsonb,
        status text DEFAULT 'pending',
        created_at timestamptz DEFAULT now()
      );
    `);

    // 5. Agregar policies RLS básicas (si es necesario, por ahora asumimos acceso abierto o gestionado por aplicación)
    // Nota: En producción, deberíamos asegurar que solo el dueño de la compañía pueda ver sus invites/requests.
    
    console.log('✅ Esquema de Onboarding aplicado exitosamente.');

  } catch (err) {
    console.error('❌ Error al aplicar el esquema:', err);
  } finally {
    await client.end();
  }
}

applySchema();
