const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let envVars = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envVars = envContent.split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      acc[key] = value;
    }
    return acc;
  }, {});
} catch (e) {
  console.error('Error loading .env.local', e);
}

const connectionString = envVars.DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is missing. Please check .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = `
      -- 1. Add columns to company_messages
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_messages' AND column_name='reply_to_id') THEN
          ALTER TABLE company_messages ADD COLUMN reply_to_id uuid REFERENCES company_messages(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_messages' AND column_name='message_type') THEN
          ALTER TABLE company_messages ADD COLUMN message_type text DEFAULT 'text';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_messages' AND column_name='metadata') THEN
          ALTER TABLE company_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
        END IF;
      END $$;

      -- 2. Ensure support_tickets has assigned_installer_id (it should, but just checking)
      -- This is just a check, we won't alter it as it exists in types.
      
      -- 3. Update RLS policies if needed (usually existing policies cover new columns, but good to check)
      -- Existing policies: "Users can view messages from their company", "Users can insert..."
      -- These policies are row-based on company_id, so new columns are automatically covered.END $$;
    `;

    await client.query(sql);
    console.log('Migration steps applied.');
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await client.end();
  }
}

run();
