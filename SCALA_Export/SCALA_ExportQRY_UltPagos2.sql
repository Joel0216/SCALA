SELECT DISTINCTROW Count(Alumnos.Credencial) AS CountOfCredencial, Grupos.Curso
FROM Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave
WHERE (((Alumnos.[Fecha Baja]) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Grupos.Curso
WITH OWNERACCESS OPTION;
