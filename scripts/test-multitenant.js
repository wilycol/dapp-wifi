const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuración (Desde .env)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('❌ Error: Faltan variables de entorno en .env.local');
  process.exit(1);
}

// Cliente Admin (Service Role) para setup
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTest() {
  console.log("🚀 Iniciando Test de Aislamiento Multi-Tenant...");

  try {
    // 1. SETUP: Crear Empresas y Usuarios
    console.log("\n--- SETUP ---");
    
    // Crear Company A
    const { data: companyA, error: errCoA } = await adminClient
      .from('companies')
      .insert({ name: 'Company A', plan: 'basic', slug: 'comp-a-' + Date.now(), is_active: true })
      .select()
      .single();
    if (errCoA) throw errCoA;
    console.log(`✅ Company A creada: ${companyA.id}`);

    // Crear Company B
    const { data: companyB, error: errCoB } = await adminClient
      .from('companies')
      .insert({ name: 'Company B', plan: 'basic', slug: 'comp-b-' + Date.now(), is_active: true })
      .select()
      .single();
    if (errCoB) throw errCoB;
    console.log(`✅ Company B creada: ${companyB.id}`);

    // Crear User A (Auth)
    const emailA = `usera_${Date.now()}@test.com`;
    const { data: authA, error: errAuthA } = await adminClient.auth.admin.createUser({
      email: emailA,
      password: 'password123',
      email_confirm: true
    });
    if (errAuthA) throw errAuthA;
    console.log(`✅ User A creado: ${authA.user.id}`);

    // Crear User B (Auth)
    const emailB = `userb_${Date.now()}@test.com`;
    const { data: authB, error: errAuthB } = await adminClient.auth.admin.createUser({
      email: emailB,
      password: 'password123',
      email_confirm: true
    });
    if (errAuthB) throw errAuthB;
    console.log(`✅ User B creado: ${authB.user.id}`);

    // Vincular Perfiles (Profiles)
    // Nota: El trigger on_auth_user_created podría haber creado el perfil ya, o no.
    // Intentamos actualizarlo. Si no existe, lo insertamos.
    
    // User A -> Company A
    const { error: errProfA } = await adminClient
      .from('profiles')
      .upsert({ 
        id: authA.user.id, 
        company_id: companyA.id, 
        role: 'Admin',
        full_name: 'User A Test'
        // email: emailA // No existe columna email en profiles
      });
    if (errProfA) throw errProfA;
    console.log(`✅ Perfil A vinculado a Company A`);

    // User B -> Company B
    const { error: errProfB } = await adminClient
      .from('profiles')
      .upsert({ 
        id: authB.user.id, 
        company_id: companyB.id, 
        role: 'Admin',
        full_name: 'User B Test'
        // email: emailB // No existe columna email en profiles
      });
    if (errProfB) throw errProfB;
    console.log(`✅ Perfil B vinculado a Company B`);

    // 2. CLIENTES CON JWT (Simulando Frontend)
    console.log("Iniciando sesión User A...");
    const { data: loginA, error: errLoginA } = await adminClient.auth.signInWithPassword({
      email: emailA,
      password: 'password123'
    });
    if (errLoginA) throw errLoginA;
    if (!loginA.session) throw new Error("No session for User A");
    console.log("User A logueado. Token:", loginA.session.access_token.substring(0, 20) + "...");

    const clientA = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${loginA.session.access_token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    console.log("Iniciando sesión User B...");
    const { data: loginB, error: errLoginB } = await adminClient.auth.signInWithPassword({
      email: emailB,
      password: 'password123'
    });
    if (errLoginB) throw errLoginB;
    if (!loginB.session) throw new Error("No session for User B");
    console.log("User B logueado. Token:", loginB.session.access_token.substring(0, 20) + "...");

    const clientB = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${loginB.session.access_token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    console.log("\n--- TEST EXECUTION ---");

    // TEST 0: User A crea un CLIENTE en Company A
    const { data: newClientA, error: errClientA } = await clientA
      .from('clients')
      .insert({
        full_name: 'Cliente Test A', // nombre -> full_name
        address: 'Calle Falsa 123',
        // plan: 'Residencial', // No existe columna plan
        company_id: companyA.id,
        status: 'Activo'
      })
      .select()
      .single();

    if (errClientA) {
        console.log(`❌ FAIL: User A no pudo crear cliente en su propia empresa: ${errClientA.message}`);
        throw errClientA;
    }
    console.log(`✅ PASS: User A creó cliente ${newClientA.id}`);

    // TEST 1: User A crea un Ticket en Company A
    const { data: ticketA, error: errTickA } = await clientA
      .from('support_tickets')
      .insert({
        title: 'Problema en Company A',
        description: 'Test isolation',
        company_id: companyA.id, // Debe coincidir
        client_id: newClientA.id,
        priority: 'Alta'
      })
      .select()
      .single();
    
    if (errTickA) {
        console.log(`❌ FAIL: User A no pudo crear ticket en su propia empresa: ${errTickA.message}`);
    } else {
        console.log(`✅ PASS: User A creó ticket ${ticketA.id}`);
    }

    if (ticketA) {
      // TEST 2: User B intenta LEER el ticket de User A
      const { data: readB, error: errReadB } = await clientB
        .from('support_tickets')
        .select('*')
        .eq('id', ticketA.id);
      
      if (readB && readB.length > 0) {
          console.log(`❌ FAIL: User B pudo leer ticket de Company A! (Violación de Seguridad)`);
      } else {
          console.log(`✅ PASS: User B NO pudo leer ticket de Company A (Array vacío)`);
      }

      // TEST 3: User B intenta ACTUALIZAR el ticket de User A
      const { data: updateB, error: errUpdateB } = await clientB
        .from('support_tickets')
        .update({ title: 'HACKED BY B' })
        .eq('id', ticketA.id)
        .select();
      
      if (updateB && updateB.length > 0) {
          console.log(`❌ FAIL: User B pudo actualizar ticket de Company A!`);
      } else {
          console.log(`✅ PASS: User B NO pudo actualizar ticket de Company A`);
      }
    } else {
      console.log("⚠️ Skipping Cross-Tenant tests because Ticket A creation failed.");
    }

    // TEST 4: User A intenta leer sus propios tickets
    const { data: readA, error: errReadA } = await clientA
      .from('support_tickets')
      .select('*');
    
    if (readA && readA.length > 0) {
        console.log(`✅ PASS: User A ve sus tickets (${readA.length})`);
    } else {
        console.log(`❌ FAIL: User A no ve sus propios tickets`);
    }

    // 3. CLEANUP
    console.log("\n--- CLEANUP ---");
    // Eliminar usuarios (Cascada debería borrar perfiles, pero companies quedan)
    await adminClient.auth.admin.deleteUser(authA.user.id);
    await adminClient.auth.admin.deleteUser(authB.user.id);
    await adminClient.from('companies').delete().eq('id', companyA.id);
    await adminClient.from('companies').delete().eq('id', companyB.id);
    console.log("✅ Datos de prueba eliminados.");

  } catch (err) {
    console.error("❌ Error inesperado:", err);
  }
}

runTest();
