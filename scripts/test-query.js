const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Need a valid access token to test authenticated RLS
// But I can test with service role key to bypass RLS and check if the query structure is valid
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  console.log('Testing query with "clients"...');
  const { data, error } = await adminClient
    .from('support_tickets')
    .select('*, clients(name, address)')
    .limit(1);
  
  if (error) {
    console.error('Error with "clients":', error);
  } else {
    console.log('Success with "clients":', data);
  }

  console.log('\nTesting query with "client"...');
  const { data: data2, error: error2 } = await adminClient
    .from('support_tickets')
    .select('*, client(name, address)')
    .limit(1);

  if (error2) {
    console.error('Error with "client":', error2);
  } else {
    console.log('Success with "client":', data2);
  }
}

testQuery();
