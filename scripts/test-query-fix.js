const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Cliente Admin (Service Role) para setup
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  console.log('Testing query with "clients(full_name, address)"...');
  const { data, error } = await adminClient
    .from('support_tickets')
    .select('*, clients(full_name, address)')
    .limit(1);
  
  if (error) {
    console.error('❌ Error with "clients":', error);
  } else {
    console.log('✅ Success with "clients":', data);
  }
}

testQuery();
