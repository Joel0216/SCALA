TRANSFORM Count(Alumnos_bajas.Credencial) AS CuentaDeCredencial
SELECT Alumnos_bajas.[Clave Motivo], Alumnos_bajas.[Fecha Ingreso]
FROM Alumnos_bajas
GROUP BY Alumnos_bajas.[Clave Motivo], Alumnos_bajas.Motivo, Alumnos_bajas.[Fecha Ingreso]
ORDER BY Alumnos_bajas.[Clave Motivo], Alumnos_bajas.Curso
PIVOT Alumnos_bajas.Curso;
