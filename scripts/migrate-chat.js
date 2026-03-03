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
      -- 1. Create table
      create table if not exists company_messages (
        id uuid default gen_random_uuid() primary key,
        company_id uuid references companies(id) not null,
        sender_id uuid references profiles(id) not null,
        content text not null,
        created_at timestamptz default now()
      );

      -- 2. Enable RLS
      alter table company_messages enable row level security;

      -- 3. Create policies
      drop policy if exists "Users can view messages from their company" on company_messages;
      create policy "Users can view messages from their company"
        on company_messages for select
        using (
          exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.company_id = company_messages.company_id
          )
        );

      drop policy if exists "Users can insert messages for their company" on company_messages;
      create policy "Users can insert messages for their company"
        on company_messages for insert
        with check (
          exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.company_id = company_messages.company_id
          )
        );

      -- 4. Enable Realtime
      do $$
      begin
        if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'company_messages') then
          alter publication supabase_realtime add table company_messages;
        end if;
      end
      $$;
    `;

    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await client.end();
  }
}

run();
