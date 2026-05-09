SELECT DISTINCTROW Count(Alumnos.Credencial) AS CountOfCredencial, Sum(IIf([BECA],[COSTO]*[PORCENTAJE],[COSTO])) AS Expr1
FROM Cursos INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave) ON Cursos.Curso=Grupos.Curso
WHERE (((Alumnos.[Fecha Baja]) Between [FECHA DE INICIO : ] And [FECHA FIN : ]) AND ((Alumnos.[Fecha Baja]) Is Not Null))
WITH OWNERACCESS OPTION;
