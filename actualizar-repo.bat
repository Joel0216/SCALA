@echo off
echo ========================================
echo Actualizando Repositorio SCALA
echo ========================================
echo.

echo Agregando archivos...
git add .

echo.
git commit -m "fix(system): optimizacion de reportes, catalogos globales y becas - Correccion del motor de reportes multi-org SuperAdmin - Comparte globalmente motivos de baja, instrumentos y medios - Aisla estrictamente los salones por organizacion - Activa checkbox de beca automaticamente al escribir un porcentaje > 0 - Elimina botones de diagnostico y emojis - PDF/CSV etiquetados por organizacion - Estabilizacion total"

echo.
echo Subiendo cambios a GitHub...
git push origin main

echo.
echo ========================================
echo Actualizacion completada!
echo ========================================
pause
