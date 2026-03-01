const { createClient } = require('./db-client');
const client = createClient();

async function checkPolicies() {
  await client.connect();
  const res = await client.query(`
    SELECT tablename, policyname, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'profiles'
  `);
  console.log(res.rows);
  await client.end();
}
checkPolicies();