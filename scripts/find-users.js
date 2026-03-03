
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUsers() {
  console.log('Buscando usuarios "defilyqav2" y "Paula"...');

  // Buscar perfiles que coincidan
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, company_id');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('\n--- Perfiles Encontrados ---');
  const admin = profiles.find(p => p.email?.includes('defily') || p.full_name?.includes('defily'));
  const paula = profiles.find(p => p.email?.includes('paula') || p.full_name?.includes('Paula'));

  if (admin) console.log('Admin (defily):', admin);
  else console.log('Admin NO encontrado por nombre/email "defily"');

  if (paula) console.log('Paula:', paula);
  else console.log('Paula NO encontrada por nombre/email "paula"');

  console.log('\n--- Todos los Perfiles ---');
  profiles.forEach(p => console.log(`${p.role} | ${p.email} | Company: ${p.company_id}`));

  if (admin && paula) {
    console.log('\n--- Diagnóstico de Compañía ---');
    if (admin.company_id === paula.company_id) {
      console.log('✅ Ambos están en la misma compañía:', admin.company_id);
    } else {
      console.log('❌ Compañías DIFERENTES!');
      console.log(`   Admin Company: ${admin.company_id}`);
      console.log(`   Paula Company: ${paula.company_id}`);
    }

    // Verificar Installers
    console.log('\n--- Verificando Tabla Installers ---');
    const { data: installers } = await supabase
      .from('installers')
      .select('*')
      .in('id', [admin.id, paula.id]);
    
    console.log('Registros en Installers:', installers);
  }
}

findUsers();
