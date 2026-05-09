const { createClient } = require('@supabase/supabase-js');
const url = 'https://vqsduyfkgdqnigzkxazk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxc2R1eWZrZ2Rxbmlnemt4YXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzIyOTMsImV4cCI6MjA4NDYwODI5M30.l5bZubjb3PIvcFG43JTfoeguldEwwIK7wlnOnl-Ec5o';
const db = createClient(url, key);

async function run() {
    try {
        console.log('--- Inicia Proceso de Limpieza ---');
        
        // 1. Obtener todos los alumnos ordenados por ID (el más antiguo suele ser el menor ID)
        const { data: allAlumnos, error: errA } = await db.from('alumnos').select('*').order('id');
        if (errA) throw errA;
        if (!allAlumnos) return;

        const nameGroups = {};
        allAlumnos.forEach(a => {
            const k = (a.nombre || '').trim().toLowerCase();
            if (!nameGroups[k]) nameGroups[k] = [];
            nameGroups[k].push(a);
        });

        const dups = Object.entries(nameGroups).filter(([k,v]) => v.length > 1);
        console.log(`Se encontraron ${dups.length} grupos de nombres duplicados.`);

        const stats = {
            relinked_groups: 0,
            relinked_receipts: 0,
            deleted: 0
        };

        for (const [name, students] of dups) {
            const master = students[0]; // Master is the one with lowest ID
            const duplicates = students.slice(1);

            console.log(`Procesando master: ${master.nombre} (ID: ${master.id})`);

            for (const dup of duplicates) {
                console.log(`  -> Unificando duplicado (ID: ${dup.id})`);

                // 1. Re-vincular inscripciones (alumno_grupos)
                const { error: e1 } = await db.from('alumno_grupos')
                    .update({ alumno_id: master.id })
                    .eq('alumno_id', dup.id);
                if (!e1) stats.relinked_groups++;

                // 2. Re-vincular recibos (recibos_detalle)
                const { error: e2 } = await db.from('recibos_detalle')
                    .update({ alumno_id: master.id })
                    .eq('alumno_id', dup.id);
                if (!e2) stats.relinked_receipts++;

                // 3. Eliminar el registro duplicado de la tabla alumnos
                const { error: e3 } = await db.from('alumnos')
                    .delete()
                    .eq('id', dup.id);
                
                if (!e3) {
                    stats.deleted++;
                } else {
                    console.error(`  Error eliminando ID ${dup.id}:`, e3.message);
                }
            }
        }

        console.log('--- Proceso Finalizado ---');
        console.log('Estadísticas finales:', JSON.stringify(stats, null, 2));

    } catch (e) {
        console.error('Error fatal en el script:', e);
    }
}

run();
