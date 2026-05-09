const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vqsduyfkgdqnigzkxazk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzIyOTMsImV4cCI6MjA4NDYwODI5M30.l5bZubjb3PIvcFG43JTfoeguldEwwIK7wlnOnl-Ec5o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Grupos ---');
    const { data: grupos, error: gError } = await supabase
        .from('grupos')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);
    
    if (gError) console.error('Error fetching grupos:', gError);
    else console.log('Recent Grupos:', JSON.stringify(grupos, null, 2));

    console.log('\n--- Checking Alumno Grupos (Relations) ---');
    const { data: rels, error: rError } = await supabase
        .from('alumno_grupos')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

    const results = {
        grupos: grupos || [],
        relations: rels || [],
        errors: { gError, rError }
    };

    fs.writeFileSync('tmp/db-check-results.json', JSON.stringify(results, null, 2));
    console.log('Results written to tmp/db-check-results.json');
}

check();
