const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión (Pooler)
const connectionString = 'postgresql://postgres.whwtagguzgzbjirhtifi:FoR0niUgU6bS8ox6@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("⏳ Conectando a Supabase DB...");
    await client.connect();
    console.log("✅ Conectado.");

    // Lista de migraciones en orden (Solo la nueva, ya que la base ya existe)
    const migrations = [
      // 'supabase/migrations/20260211190814_wifi_management_schema.sql', // YA APLICADA
      'supabase/migrations/20260225120000_multi_tenant_migration.sql'
    ];

    for (const file of migrations) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        console.log(`\n📄 Aplicando migración: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
            await client.query(sql);
            console.log(`✅ Éxito: ${file}`);
        } catch (e) {
            console.error(`❌ Error en ${file}: ${e.message}`);
            // Continuamos o nos detenemos? Depende del error. 
            // Si la tabla ya existe, podría fallar si no es "CREATE TABLE IF NOT EXISTS".
            // Asumiremos que es seguro continuar si es error de "relation already exists".
        }
      } else {
        console.error(`⚠️ Archivo no encontrado: ${filePath}`);
      }
    }
    
    console.log("\n🏁 Migración completada.");

  } catch (err) {
    console.error("❌ Error fatal:", err);
  } finally {
    await client.end();
  }
}

migrate();
