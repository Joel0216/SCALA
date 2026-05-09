SELECT DISTINCTROW Count(Alumnos.Credencial) AS CuentaDeCredencial, Alumnos.Reingreso, Grupos.Curso
FROM Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave
WHERE (((Alumnos.[Fecha Ingreso]) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Alumnos.Reingreso, Grupos.Curso
ORDER BY Grupos.Curso;
