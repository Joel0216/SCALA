SELECT DISTINCTROW Grupos.Curso, Count(Alumnos.Credencial) AS CountOfCredencial
FROM Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo
WHERE (((Alumnos.[Fecha Ingreso]) Between [Inicio de Periodo] And [Fin de Periodo]))
GROUP BY Grupos.Curso, Alumnos.[Fecha Baja]
HAVING (((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Grupos.Curso, Count(Alumnos.Credencial)
WITH OWNERACCESS OPTION;
