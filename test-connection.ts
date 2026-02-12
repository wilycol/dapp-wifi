import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cgcfziaxttuzgtiyhkqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnY2Z6aWF4dHR1emd0aXloa3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDY1ODMsImV4cCI6MjA4NjQ4MjU4M30.y4Jz0LJgrRaH1O0LWZVHRt0LVQWzFPJhA2qS83QYOfI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('clients').select('count');
  if (error) {
    console.error('❌ Error de conexión:', error.message);
  } else {
    console.log('✅ Conexión exitosa! Tablas detectadas.');
  }
}
test();
