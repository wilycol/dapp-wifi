const { createClient } = require('./db-client');

async function checkRLS() {
  const client = createClient();
  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND (tablename = 'support_tickets' OR tablename = 'clients');
    `);
    
    console.log('RLS Status:');
    console.table(res.rows);

    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public' AND (tablename = 'support_tickets' OR tablename = 'clients');
    `);

    console.log('RLS Policies:');
    console.table(policies.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkRLS();
