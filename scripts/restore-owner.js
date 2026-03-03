const { createClient } = require('./db-client');

async function inspectAndFix() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos...');

    // 1. Buscar la compañía "Dapp WIFI"
    console.log('🔍 Buscando compañía "Dapp WIFI"...');
    const compRes = await client.query(`SELECT * FROM companies WHERE name ILIKE '%Dapp WIFI%'`);
    
    if (compRes.rows.length === 0) {
      console.log('❌ No se encontró la compañía.');
      return;
    }

    const company = compRes.rows[0];
    console.log(`✅ Compañía encontrada: ${company.name} (ID: ${company.id})`);
    console.log(`   Owner ID registrado: ${company.owner_id}`);

    if (!company.owner_id) {
        console.log('⚠️ La compañía no tiene owner_id registrado. No puedo restaurar automáticamente sin saber el ID del usuario.');
        return;
    }

    // 2. Ver el estado actual del perfil del dueño
    const profileRes = await client.query(`SELECT * FROM profiles WHERE id = $1`, [company.owner_id]);
    const profile = profileRes.rows[0];
    
    console.log('👤 Estado actual del perfil del dueño:');
    console.log(profile);

    // 3. Restaurar permisos
    if (profile.role !== 'SuperAdmin' && profile.role !== 'Admin') {
        console.log('🚑 Detectado rol incorrecto. Restaurando a SuperAdmin...');
        
        await client.query(`
            UPDATE profiles 
            SET role = 'SuperAdmin', company_id = $1 
            WHERE id = $2
        `, [company.id, company.owner_id]);
        
        console.log('✅ Perfil restaurado exitosamente.');
    } else {
        console.log('ℹ️ El rol del perfil parece correcto. Verificando company_id...');
        if (profile.company_id !== company.id) {
            console.log('🚑 company_id incorrecto. Corrigiendo...');
            await client.query(`UPDATE profiles SET company_id = $1 WHERE id = $2`, [company.id, company.owner_id]);
            console.log('✅ company_id corregido.');
        }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

inspectAndFix();