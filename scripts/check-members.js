const { createClient } = require('@supabase/supabase-js');
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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars. Ensure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMembers() {
  console.log('--- Checking Members Enrichment ---');
  
  // 1. Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles.length} profiles.`);

  // 2. Enrich with auth data
  const enrichedMembers = await Promise.all(profiles.map(async (profile) => {
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
    
    if (userError || !user) {
      return {
        ...profile,
        email: 'Usuario no encontrado',
        full_name: 'Desconocido',
        metadata: {}
      };
    }
    
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
    return {
      id: profile.id,
      role: profile.role,
      email: user.email,
      full_name: fullName,
      metadata: user.user_metadata
    };
  }));

  console.table(enrichedMembers);
}

checkMembers();
