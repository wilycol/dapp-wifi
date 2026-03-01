const { createClient } = require('./db-client');
const fs = require('fs');
const path = require('path');

const client = createClient();

async function checkAndApplyMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase DB');

    // 1. Check if table 'processed_webhooks' exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'processed_webhooks'
      );
    `;
    const res = await client.query(checkTableQuery);
    const tableExists = res.rows[0].exists;

    if (tableExists) {
      console.log('ℹ️ Table "processed_webhooks" ALREADY EXISTS. No migration needed.');
      
      // Verify structure just in case
      const colsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'processed_webhooks';
      `;
      const colsRes = await client.query(colsQuery);
      console.log('📊 Table Structure:', colsRes.rows);

    } else {
      console.log('⚠️ Table "processed_webhooks" DOES NOT EXIST. Applying migration...');
      
      // Read migration file
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260226153000_create_processed_webhooks.sql');
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log('📄 Executing SQL from:', migrationPath);
      await client.query(migrationSql);
      
      console.log('✅ Migration applied successfully! Table "processed_webhooks" created.');
    }

  } catch (err) {
    console.error('❌ Error connecting or executing migration:', err);
  } finally {
    await client.end();
  }
}

checkAndApplyMigration();
