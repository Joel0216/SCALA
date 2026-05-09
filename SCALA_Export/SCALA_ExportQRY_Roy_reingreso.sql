SELECT DISTINCTROW Count(Alumnos.Credencial) AS CuentaDeCredencial, Alumnos.Reingreso, Grupos.Curso
FROM Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave
WHERE (((Alumnos.[Fecha Ingreso]) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Alumnos.Reingreso, Grupos.Curso
HAVING (((Alumnos.Reingreso)=-1))
ORDER BY Grupos.Curso;
