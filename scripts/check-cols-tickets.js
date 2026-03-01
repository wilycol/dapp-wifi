const { createClient } = require('./db-client');
const client = createClient();

async function checkCols() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'support_tickets'
  `);
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}
checkCols();