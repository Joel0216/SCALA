SELECT DISTINCTROW Count(Alumnos_bajas.Credencial) AS CuentaDeCredencial, Alumnos_bajas.Curso
FROM Alumnos_bajas
WHERE (((Alumnos_bajas.[Fecha Baja]) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Alumnos_bajas.Curso
ORDER BY Alumnos_bajas.Curso;
