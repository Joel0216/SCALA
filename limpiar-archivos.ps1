# Script de PowerShell para limpieza profunda del proyecto SCALA
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Limpiando archivos obsoletos y temporales en SCALA" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Archivos SQL
$sqlFiles = @(
    "ADD-TIPO-EXAMEN-TO-CURSOS.sql", "COMPREHENSIVE-UPDATE.sql", "CREATE-TIPOS-EXAMEN-SCHEMA.sql",
    "DATOS-ALUMNOS.sql", "DATOS-ARTICULOS.sql", "DATOS-CURSOS-117.sql", "DATOS-CURSOS-COMPLETOS.sql",
    "DATOS-INICIALES-SUPABASE.sql", "DATOS-MEDIOS.sql", "DATOS-MOTIVOS.sql", "DATOS-MOVIMIENTOS-COMPLETO.sql",
    "DATOS-MOVIMIENTOS.sql", "DESHABILITAR-RLS.sql", "DISABLE-RLS-RECIBOS-DETALLE.sql",
    "DROP-MOTIVOS-BAJA.sql", "Datos Grupos.sql", "EXAMENES-MIGRATION.sql", "EXAMENES-NOTA-MIGRATION.sql",
    "EXAMENES-UNIQUE-MIGRATION.sql", "FINAL-FIX-SCALA.sql", "FIX-ALL-MULTI-TENANT-VISTAS.sql",
    "FIX-CANCELLED-MULTI-TENANT.sql", "FIX-CASCADE-RAPIDO.sql", "FIX-DELETE-ORGANIZACION-CASCADE.sql",
    "FIX-ESQUEMA-GRUPOS.sql", "FIX-EXAMENES-MULTI-TENANT.sql", "FIX-EXAMENES-SCHEMA.sql",
    "FIX-MULTI-TENANT-TABLES.sql", "FIX-PERMISOS-GRANULARES.sql", "FIX-RLS-OPERACIONES.sql",
    "FIX-SCHEMA-COMPREHENSIVE.sql", "FIX-SCHEMA.sql", "FIX-SEGURIDAD-MULTI-TENANT.sql",
    "FIX-UNIQUE-CONSTRAINTS-MULTI-TENANT.sql", "Grupos.sql", "INSERT-OPERACIONES-DATOS.sql",
    "INSERT_CURSOS_FINAL.sql", "LIMPIAR_PRODUCCION.sql", "MIGRACION-DATOS-FLAT.sql",
    "MIGRACION-MULTI-TENANT.sql", "MIGRACION_MAESTROS_FINAL.sql", "PROCESO-UNIFICADO-INVENTARIO.sql",
    "RECREATE-RECIBOS-TABLES.sql", "REDISENO-OPERACIONES.sql", "REPARAR-VISTAS-PAGOS.sql",
    "SCALA_FULL_SCHEMA.sql", "SCHEMA-ALUMNOS-ACTUALIZADO.sql", "SCHEMA-ARTICULOS.sql",
    "SCHEMA-BAJAS-REINGRESOS.sql", "SCHEMA-COMPLETO-SUPABASE.sql", "SCHEMA-CURSOS.sql",
    "SCHEMA-FACTORES.sql", "SCHEMA-MEDIOS.sql", "SCHEMA-MOTIVOS-BAJA.sql", "SCHEMA-MOTIVOS.sql",
    "SCHEMA-MOVIMIENTOS-FLAT.sql", "SCHEMA-MOVIMIENTOS-INVENTARIO.sql", "SCHEMA-MOVIMIENTOS.sql",
    "SCHEMA-SALONES.sql", "SETUP-STORAGE-COMPROBANTES.sql", "SQL-READY-TO-PASTE.sql",
    "SUPABASE-SCHEMA.sql", "TABLAR-FALTANTES-SUPABASE.sql", "TABLAS-FALTANTES-SUPABASE.sql",
    "UPDATE-OPERACIONES.sql", "UPDATE_IVA_COLUMNS.sql", "add_beca_columns.sql",
    "add_payment_metadata_columns.sql", "add_reposicion_constraint.sql", "create_asistencias.sql",
    "create_cancelled_receipts_tables.sql", "create_examenes_schema.sql", "fix_articulos.sql",
    "fix_asistencias_rls.sql", "fix_cancelled_schema_types.sql", "fix_cursos.sql",
    "fix_grados.sql", "fix_grupos_articulos.sql", "fix_grupos_uuid.sql", "fix_inventarios.sql",
    "fix_maestros.sql", "fix_missing_structures.sql", "fix_rls_policies.sql", "fix_salones.sql",
    "full_schema_temp.sql", "init_db.sql", "instrumentos_salones.sql", "limpiar_base.sql",
    "promotion_logic.sql", "rfc_clientes.sql", "setup_supabase_storage.sql",
    "update_cancelled_receipts_schema.sql", "update_maestros_auth.sql", "update_sesiones_clase.sql"
)

# 2. Archivos Markdown (.md)
$mdFiles = @(
    "CAMBIOS-FACTORES.md", "CAMBIOS-GRUPOS-ARTICULOS.md", "CAMBIOS-GRUPOS-CORREGIDOS.md",
    "CAMBIOS-GRUPOS.md", "CAMBIOS-MOVIMIENTOS-INVENTARIO.md", "CHANGES_BAJAS_FACTORES.md",
    "DOCUMENTACION-ARTICULOS.md", "DOCUMENTACION-CANCELADOS.md", "DOCUMENTACION-COBROS.md",
    "DOCUMENTACION_ESTABILIZACION.md", "INSTRUCCIONES-SUPABASE.md", "RESUMEN-RAPIDO.md",
    "RESUMEN-RÁPIDO.md", "RESUMEN_CAMBIOS_MAESTROS.md"
)

# 3. Scripts y Utilidades (.py, .ps1, .js temporales)
$scriptFiles = @(
    "clean_orphaned_details.py", "extract_all_data.py", "extract_movimientos.py",
    "regenerate_clean_data.py", "validate_article_keys.py", "read_excel.py",
    "extract_all_movimientos.ps1", "extract_articulos.ps1", "extract_strings.ps1",
    "extract_strings_v2.ps1", "generate_movimientos_sql.ps1", "export_movimientos_to_csv.ps1",
    "export_xls.ps1", "export_xls_v2.ps1", "fix-all-html.ps1", "fix-all-js.ps1",
    "fix-html-for-electron.ps1", "extract_strings.js", "extract_strings_v2.js",
    "fix-db.js", "generar_sql_cursos.js", "generar_sql_maestros.js",
    "generar_sql_maestros_final.js", "generar_sql_maestros_final_v2.js",
    "generar_sql_maestros_final_v3.js", "generar_sql_maestros_v2.js",
    "generar_sql_maestros_v3.js", "generate_final_sql.py", "generate_mod_sql.js",
    "generate_rfc_sql.js", "read_rfc.js", "process_cursos.js", "check_headers.js",
    "inspect_grupos.js", "inspect_new_modules.js"
)

# 4. Páginas HTML de Prueba
$htmlTestFiles = @(
    "test-database-crud.html", "test-electron-supabase.html", "test-navegacion.html",
    "test-require.html", "test-supabase-connection.html", "debug_db.html", "export.vbs"
)

# 5. Archivos Basura y Temporales (.txt, .json)
$garbageFiles = @(
    "LEER-PRIMERO.txt", "cursos_clean.txt", "cursos_dump_utf8.txt", "cursos_dump_v2.txt",
    "cursos_strings.txt", "cursos_strings_dump.txt", "cursos_strings_utf8.txt",
    "temp_caja_files.txt", "temp_caja_files_utf8.txt", "types.txt", "types.json"
)

$allFiles = $sqlFiles + $mdFiles + $scriptFiles + $htmlTestFiles + $garbageFiles

Write-Host "Eliminando archivos..." -ForegroundColor Yellow
$count = 0
foreach ($file in $allFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
        Write-Host "  [-] Eliminado: $file" -ForegroundColor Gray
        $count++
    }
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "¡Limpieza completada! Se eliminaron $count archivos." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
