const { Client } = require('pg');

// Usando el Pooler de Conexión proporcionado
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

// Configuración SSL requerida para Supabase Pooler
const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } 
});

async function audit() {
  try {
    console.log("⏳ Conectando a Supabase DB vía Pooler...");
    await client.connect();
    console.log("✅ Conexión establecida a Supabase DB");

    console.log("\n--- 1. TABLAS PÚBLICAS Y RLS STATUS ---");
    const tablesRes = await client.query(`
      SELECT 
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `);
    
    tablesRes.rows.forEach(row => {
      console.log(`- Tabla: ${row.table_name.padEnd(20)} | RLS Habilitado: ${row.rls_enabled ? '✅ SÍ' : '❌ NO'} | RLS Forzado: ${row.rls_forced ? '⚠️ SÍ' : 'NO'}`);
    });

    console.log("\n--- 2. POLÍTICAS RLS DETALLADAS ---");
    const policiesRes = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policiesRes.rows.length === 0) {
      console.log("⚠️ No se encontraron políticas RLS activas.");
    } else {
      policiesRes.rows.forEach(p => {
        console.log(`[${p.tablename}] ${p.policyname} (${p.cmd})`);
        console.log(`   - Roles: ${p.roles}`);
        console.log(`   - USING: ${p.qual}`);
        console.log(`   - CHECK: ${p.with_check}`);
      });
    }

    console.log("\n--- 3. ÍNDICES Y RENDIMIENTO ---");
    const indexesRes = await client.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    indexesRes.rows.forEach(idx => {
        console.log(`- [${idx.tablename}] ${idx.indexname}`);
    });

    console.log("\n--- 4. CONTEO DE REGISTROS (Aproximado) ---");
    for (const row of tablesRes.rows) {
        try {
            const countRes = await client.query(`SELECT count(*) FROM public."${row.table_name}"`);
            console.log(`- ${row.table_name}: ${countRes.rows[0].count} registros`);
        } catch (e) {
            console.log(`- ${row.table_name}: Error al contar (${e.message})`);
        }
    }

  } catch (err) {
    console.error("❌ Error de conexión o consulta:", err);
  } finally {
    await client.end();
  }
}

audit();
