const { createClient } = require('./db-client');
const client = createClient();

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