@echo off
echo ========================================
echo Actualizando Repositorio SCALA
echo ========================================
echo.

echo Agregando archivos...
git add .

echo.
echo Haciendo commit...
git commit -m "README actualizado - Sistema 100%% funcional - Agregadas nuevas funcionalidades y documentacion"

echo.
echo Subiendo cambios a GitHub...
git push origin main

echo.
echo ========================================
echo Actualizacion completada!
echo ========================================
pause
