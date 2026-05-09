const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vqsduyfkgdqnigzkxazk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzIyOTMsImV4cCI6MjA4NDYwODI5M30.l5bZubjb3PIvcFG43JTfoeguldEwwIK7wlnOnl-Ec5o';
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRPC() {
    console.log('Testing RPC increment...');
    // Try to increment for a dummy or real group if possible
    const { data, error } = await db.rpc('increment_grupo_alumnos', { p_grupo_clave: 'ABCAZLU21' });
    
    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success:', data);
    }
}

testRPC();
