SELECT DISTINCTROW Alumnos.Porcentaje, Count(Alumnos.Nombre) AS CountOfNombre, Sum([Costo]*[Porcentaje]) AS Expr1, Sum(Cursos.Costo) AS SumOfCosto
FROM Cursos INNER JOIN (Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) ON Cursos.Curso=Grupos.Curso
WHERE (((Alumnos.[Fecha Ingreso])<=[FECHA FIN : ]) AND ((Alumnos.[Fecha Baja]) Is Null))
GROUP BY Alumnos.Porcentaje
HAVING (((Alumnos.Porcentaje) Is Not Null))
WITH OWNERACCESS OPTION;
