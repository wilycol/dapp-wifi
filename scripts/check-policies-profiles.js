const { Client } = require('pg');
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

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