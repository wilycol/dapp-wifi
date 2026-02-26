const { Client } = require('pg');
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function fix() {
  await client.connect();
  
  try {
      await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read own profile') THEN
                CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
            END IF;
        END $$;
      `);
      console.log("✅ Added policy 'Users can read own profile' to profiles table");
  } catch (e) {
      console.error("❌ Error adding policy:", e);
  }

  await client.end();
}
fix();