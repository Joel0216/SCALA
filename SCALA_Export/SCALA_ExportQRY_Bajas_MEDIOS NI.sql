TRANSFORM Count(Alumnos_bajas.QueMedio) AS [Resumen de la fila]
SELECT Alumnos_bajas.[Clave Motivo], Alumnos_bajas.Motivo, Count(Alumnos_bajas.Credencial) AS CuentaDeCredencial
FROM Alumnos_bajas
GROUP BY Alumnos_bajas.[Clave Motivo], Alumnos_bajas.Motivo, Alumnos_bajas.[Fecha Baja]
ORDER BY Alumnos_bajas.[Clave Motivo], Alumnos_bajas.Motivo
PIVOT Alumnos_bajas.Maestro;
