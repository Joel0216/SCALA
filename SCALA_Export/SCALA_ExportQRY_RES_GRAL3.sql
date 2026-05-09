SELECT DISTINCTROW Count(Alumnos.Credencial) AS CountOfCredencial, Sum(IIf([BECA],[COSTO]*[PORCENTAJE],[COSTO])) AS Expr1
FROM Cursos INNER JOIN (Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) ON Cursos.Curso=Grupos.Curso
WHERE (((Alumnos.[Fecha Ingreso])>=[FECHA DE INICIO : ] And (Alumnos.[Fecha Ingreso])<=[FECHA FIN : ]) AND ((Alumnos.[Fecha Baja]) Is Null))
WITH OWNERACCESS OPTION;
