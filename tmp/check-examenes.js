const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vqsduyfkgdqnigzkxazk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzIyOTMsImV4cCI6MjA4NDYwODI5M30.l5bZubjb3PIvcFG43JTfoeguldEwwIK7wlnOnl-Ec5o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const alumnoId = 'c6ad47dc-99c6-48e6-811c-b2a902a5d4ba'; // ADS, Credencial 3779
    
    console.log('1. Checking resultados_examen directly:');
    const { data: resEx, error: errEx } = await supabase
        .from('resultados_examen')
        .select('*')
        .eq('alumno_id', alumnoId);
    console.log('Resultados Examen:', JSON.stringify(resEx, null, 2));
    if (errEx) console.error('Error in resultados_examen:', errEx);

    console.log('\n2. Checking v_examenes_alumno:');
    const { data: vEx, error: errV } = await supabase
        .from('v_examenes_alumno')
        .select('*')
        .eq('alumno_id', alumnoId);
    console.log('v_examenes_alumno data:', JSON.stringify(vEx, null, 2));
    if (errV) console.error('Error in v_examenes_alumno:', errV);

    console.log('\n3. Checking programacion_examenes for EX-001:');
    const { data: progEx, error: errProg } = await supabase
        .from('programacion_examenes')
        .select('*')
        .eq('clave_examen', 'EX-001');
    console.log('Programacion Examenes:', JSON.stringify(progEx, null, 2));
    if (errProg) console.error('Error in programacion_examenes:', errProg);

    fs.writeFileSync('tmp/check-examenes-output.json', JSON.stringify({ resEx, vEx, progEx, errEx, errV, errProg }, null, 2));
}

check();
