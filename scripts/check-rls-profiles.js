const { Client } = require('pg');
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function checkRLS() {
  await client.connect();
  const res = await client.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = 'profiles'
  `);
  console.log(res.rows);
  await client.end();
}
checkRLS();