const { Client } = require('pg');
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function checkCols() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'profiles'
  `);
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}
checkCols();