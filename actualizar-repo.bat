@echo off
echo ========================================
echo Actualizando Repositorio SCALA
echo ========================================
echo.

echo Agregando archivos...
git add .

echo.
echo Haciendo commit...
git commit -m "fix(reportes): motor reportes corregido + multi-org SuperAdmin - Corrige motivo_baja_id en alumnos_baja - Queries defensivos con fallback para tablas sin organizacion_id - Selector de organizacion para SuperAdmin (Todas/especifica) - PDF y CSV etiquetados por organizacion - Elimina validacion de fechas en reportes sin fecha - Limpia input al cambiar a tipo month (deudores) - Elimina botones DIAGNOSTICO y TEST BD del menu - Sin emojis en modulo reportes - Mensaje simplificado cuando no hay datos"

echo.
echo Subiendo cambios a GitHub...
git push origin main

echo.
echo ========================================
echo Actualizacion completada!
echo ========================================
pause
