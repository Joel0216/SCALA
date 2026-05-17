@echo off
echo ===================================================
echo Limpiando archivos obsoletos y temporales en SCALA
echo ===================================================
echo.

echo Eliminando archivos .sql temporales y de migracion...
del /q "ADD-TIPO-EXAMEN-TO-CURSOS.sql" 2>nul
del /q "COMPREHENSIVE-UPDATE.sql" 2>nul
del /q "CREATE-TIPOS-EXAMEN-SCHEMA.sql" 2>nul
del /q "DATOS-ALUMNOS.sql" 2>nul
del /q "DATOS-ARTICULOS.sql" 2>nul
del /q "DATOS-CURSOS-117.sql" 2>nul
del /q "DATOS-CURSOS-COMPLETOS.sql" 2>nul
del /q "DATOS-INICIALES-SUPABASE.sql" 2>nul
del /q "DATOS-MEDIOS.sql" 2>nul
del /q "DATOS-MOTIVOS.sql" 2>nul
del /q "DATOS-MOVIMIENTOS-COMPLETO.sql" 2>nul
del /q "DATOS-MOVIMIENTOS.sql" 2>nul
del /q "DESHABILITAR-RLS.sql" 2>nul
del /q "DISABLE-RLS-RECIBOS-DETALLE.sql" 2>nul
del /q "DROP-MOTIVOS-BAJA.sql" 2>nul
del /q "Datos Grupos.sql" 2>nul
del /q "EXAMENES-MIGRATION.sql" 2>nul
del /q "EXAMENES-NOTA-MIGRATION.sql" 2>nul
del /q "EXAMENES-UNIQUE-MIGRATION.sql" 2>nul
del /q "FINAL-FIX-SCALA.sql" 2>nul
del /q "FIX-ALL-MULTI-TENANT-VISTAS.sql" 2>nul
del /q "FIX-CANCELLED-MULTI-TENANT.sql" 2>nul
del /q "FIX-CASCADE-RAPIDO.sql" 2>nul
del /q "FIX-DELETE-ORGANIZACION-CASCADE.sql" 2>nul
del /q "FIX-ESQUEMA-GRUPOS.sql" 2>nul
del /q "FIX-EXAMENES-MULTI-TENANT.sql" 2>nul
del /q "FIX-EXAMENES-SCHEMA.sql" 2>nul
del /q "FIX-MULTI-TENANT-TABLES.sql" 2>nul
del /q "FIX-PERMISOS-GRANULARES.sql" 2>nul
del /q "FIX-RLS-OPERACIONES.sql" 2>nul
del /q "FIX-SCHEMA-COMPREHENSIVE.sql" 2>nul
del /q "FIX-SCHEMA.sql" 2>nul
del /q "FIX-SEGURIDAD-MULTI-TENANT.sql" 2>nul
del /q "FIX-UNIQUE-CONSTRAINTS-MULTI-TENANT.sql" 2>nul
del /q "Grupos.sql" 2>nul
del /q "INSERT-OPERACIONES-DATOS.sql" 2>nul
del /q "INSERT_CURSOS_FINAL.sql" 2>nul
del /q "LIMPIAR_PRODUCCION.sql" 2>nul
del /q "MIGRACION-DATOS-FLAT.sql" 2>nul
del /q "MIGRACION-MULTI-TENANT.sql" 2>nul
del /q "MIGRACION_MAESTROS_FINAL.sql" 2>nul
del /q "PROCESO-UNIFICADO-INVENTARIO.sql" 2>nul
del /q "RECREATE-RECIBOS-TABLES.sql" 2>nul
del /q "REDISENO-OPERACIONES.sql" 2>nul
del /q "REPARAR-VISTAS-PAGOS.sql" 2>nul
del /q "SCALA_FULL_SCHEMA.sql" 2>nul
del /q "SCHEMA-ALUMNOS-ACTUALIZADO.sql" 2>nul
del /q "SCHEMA-ARTICULOS.sql" 2>nul
del /q "SCHEMA-BAJAS-REINGRESOS.sql" 2>nul
del /q "SCHEMA-COMPLETO-SUPABASE.sql" 2>nul
del /q "SCHEMA-CURSOS.sql" 2>nul
del /q "SCHEMA-FACTORES.sql" 2>nul
del /q "SCHEMA-MEDIOS.sql" 2>nul
del /q "SCHEMA-MOTIVOS-BAJA.sql" 2>nul
del /q "SCHEMA-MOTIVOS.sql" 2>nul
del /q "SCHEMA-MOVIMIENTOS-FLAT.sql" 2>nul
del /q "SCHEMA-MOVIMIENTOS-INVENTARIO.sql" 2>nul
del /q "SCHEMA-MOVIMIENTOS.sql" 2>nul
del /q "SCHEMA-SALONES.sql" 2>nul
del /q "SETUP-STORAGE-COMPROBANTES.sql" 2>nul
del /q "SQL-READY-TO-PASTE.sql" 2>nul
del /q "SUPABASE-SCHEMA.sql" 2>nul
del /q "TABLAR-FALTANTES-SUPABASE.sql" 2>nul
del /q "TABLAS-FALTANTES-SUPABASE.sql" 2>nul
del /q "UPDATE-OPERACIONES.sql" 2>nul
del /q "UPDATE_IVA_COLUMNS.sql" 2>nul
del /q "add_beca_columns.sql" 2>nul
del /q "add_payment_metadata_columns.sql" 2>nul
del /q "add_reposicion_constraint.sql" 2>nul
del /q "create_asistencias.sql" 2>nul
del /q "create_cancelled_receipts_tables.sql" 2>nul
del /q "create_examenes_schema.sql" 2>nul
del /q "fix_articulos.sql" 2>nul
del /q "fix_asistencias_rls.sql" 2>nul
del /q "fix_cancelled_schema_types.sql" 2>nul
del /q "fix_cursos.sql" 2>nul
del /q "fix_grados.sql" 2>nul
del /q "fix_grupos_articulos.sql" 2>nul
del /q "fix_grupos_uuid.sql" 2>nul
del /q "fix_inventarios.sql" 2>nul
del /q "fix_maestros.sql" 2>nul
del /q "fix_missing_structures.sql" 2>nul
del /q "fix_rls_policies.sql" 2>nul
del /q "fix_salones.sql" 2>nul
del /q "full_schema_temp.sql" 2>nul
del /q "init_db.sql" 2>nul
del /q "instrumentos_salones.sql" 2>nul
del /q "limpiar_base.sql" 2>nul
del /q "promotion_logic.sql" 2>nul
del /q "rfc_clientes.sql" 2>nul
del /q "setup_supabase_storage.sql" 2>nul
del /q "update_cancelled_receipts_schema.sql" 2>nul
del /q "update_maestros_auth.sql" 2>nul
del /q "update_sesiones_clase.sql" 2>nul

echo Eliminando archivos .md de documentacion vieja...
del /q "CAMBIOS-FACTORES.md" 2>nul
del /q "CAMBIOS-GRUPOS-ARTICULOS.md" 2>nul
del /q "CAMBIOS-GRUPOS-CORREGIDOS.md" 2>nul
del /q "CAMBIOS-GRUPOS.md" 2>nul
del /q "CAMBIOS-MOVIMIENTOS-INVENTARIO.md" 2>nul
del /q "CHANGES_BAJAS_FACTORES.md" 2>nul
del /q "DOCUMENTACION-ARTICULOS.md" 2>nul
del /q "DOCUMENTACION-CANCELADOS.md" 2>nul
del /q "DOCUMENTACION-COBROS.md" 2>nul
del /q "DOCUMENTACION_ESTABILIZACION.md" 2>nul
del /q "INSTRUCCIONES-SUPABASE.md" 2>nul
del /q "RESUMEN-RAPIDO.md" 2>nul
del /q "RESUMEN-RÁPIDO.md" 2>nul
del /q "RESUMEN_CAMBIOS_MAESTROS.md" 2>nul

echo Eliminando scripts de utilidad antiguos (.py, .ps1, .js de carga)...
del /q "clean_orphaned_details.py" 2>nul
del /q "extract_all_data.py" 2>nul
del /q "extract_movimientos.py" 2>nul
del /q "regenerate_clean_data.py" 2>nul
del /q "validate_article_keys.py" 2>nul
del /q "read_excel.py" 2>nul
del /q "extract_all_movimientos.ps1" 2>nul
del /q "extract_articulos.ps1" 2>nul
del /q "extract_strings.ps1" 2>nul
del /q "extract_strings_v2.ps1" 2>nul
del /q "generate_movimientos_sql.ps1" 2>nul
del /q "export_movimientos_to_csv.ps1" 2>nul
del /q "export_xls.ps1" 2>nul
del /q "export_xls_v2.ps1" 2>nul
del /q "fix-all-html.ps1" 2>nul
del /q "fix-all-js.ps1" 2>nul
del /q "fix-html-for-electron.ps1" 2>nul
del /q "extract_strings.js" 2>nul
del /q "extract_strings_v2.js" 2>nul
del /q "fix-db.js" 2>nul
del /q "generar_sql_cursos.js" 2>nul
del /q "generar_sql_maestros.js" 2>nul
del /q "generar_sql_maestros_final.js" 2>nul
del /q "generar_sql_maestros_final_v2.js" 2>nul
del /q "generar_sql_maestros_final_v3.js" 2>nul
del /q "generar_sql_maestros_v2.js" 2>nul
del /q "generar_sql_maestros_v3.js" 2>nul
del /q "generate_final_sql.py" 2>nul
del /q "generate_mod_sql.js" 2>nul
del /q "generate_rfc_sql.js" 2>nul
del /q "read_rfc.js" 2>nul
del /q "process_cursos.js" 2>nul
del /q "check_headers.js" 2>nul
del /q "inspect_grupos.js" 2>nul
del /q "inspect_new_modules.js" 2>nul

echo Eliminando paginas HTML de pruebas y diagnosticos antiguos...
del /q "test-database-crud.html" 2>nul
del /q "test-electron-supabase.html" 2>nul
del /q "test-navegacion.html" 2>nul
del /q "test-require.html" 2>nul
del /q "test-supabase-connection.html" 2>nul
del /q "debug_db.html" 2>nul
del /q "export.vbs" 2>nul

echo Eliminando otros archivos basura y temporales...
del /q "LEER-PRIMERO.txt" 2>nul
del /q "cursos_clean.txt" 2>nul
del /q "cursos_dump_utf8.txt" 2>nul
del /q "cursos_dump_v2.txt" 2>nul
del /q "cursos_strings.txt" 2>nul
del /q "cursos_strings_dump.txt" 2>nul
del /q "cursos_strings_utf8.txt" 2>nul
del /q "temp_caja_files.txt" 2>nul
del /q "temp_caja_files_utf8.txt" 2>nul
del /q "types.txt" 2>nul
del /q "types.json" 2>nul

echo.
echo ===================================================
echo Limpieza completa del proyecto finalizada!
echo ===================================================
pause
