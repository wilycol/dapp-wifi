const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

function createClient() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = { createClient };
