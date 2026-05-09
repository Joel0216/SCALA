SELECT DISTINCTROW Count(Alumnos.Credencial) AS CountOfCredencial, Sum(IIf([beca],[costo]*[porcentaje],[costo])) AS Expr1
FROM Cursos INNER JOIN (Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) ON Cursos.Curso=Grupos.Curso
WHERE (((Alumnos.[Fecha Baja]) Is Null))
WITH OWNERACCESS OPTION;
