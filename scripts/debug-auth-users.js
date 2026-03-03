
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  console.log('Listando usuarios desde Auth Admin...');

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Encontrados ${users.length} usuarios.`);

  // Obtener perfiles para cruzar datos
  const { data: profiles } = await supabase.from('profiles').select('*');

  // Mapear y mostrar
  console.log('\n--- Usuarios y sus Compañías ---');
  users.forEach(u => {
    const profile = profiles.find(p => p.id === u.id);
    const companyId = profile ? profile.company_id : 'SIN PERFIL';
    const role = profile ? profile.role : 'N/A';
    
    // Filtrar solo los relevantes para no llenar la consola
    if (u.email.includes('defily') || u.email.includes('paula') || u.email.includes('admin')) {
        console.log(`Email: ${u.email} | ID: ${u.id}`);
        console.log(`   -> Rol: ${role} | Company: ${companyId}`);
        console.log('-----------------------------------');
    }
  });
}

listUsers();
