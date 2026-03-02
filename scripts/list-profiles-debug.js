const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Admin client to bypass RLS
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listProfiles() {
  console.log('Fetching profiles...');
  // Intentamos traer todas las columnas primero para ver qué hay
  const { data: profiles, error } = await adminClient
    .from('profiles')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('Available Profiles (Sample):');
  console.log(profiles);
}

listProfiles();
