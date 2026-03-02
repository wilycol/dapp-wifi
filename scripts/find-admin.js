const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAdmin() {
  console.log('Searching for admin profiles...');
  const { data: profiles, error } = await adminClient
    .from('profiles')
    .select('*')
    .ilike('email', '%admin%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found profiles:');
  console.table(profiles);
}

findAdmin();
