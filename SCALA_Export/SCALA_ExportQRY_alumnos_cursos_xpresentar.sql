SELECT Alumnos.Credencial, Alumnos.Nombre, ProgramacionExamenes.curso, ProgramacionExamenes.FechaExamen, ProgramacionExamenes.ClaveExamen, DateDiff("m",Alumnos.[Fecha Ingreso],ProgramacionExamenes.FechaExamen) AS Expr1, Alumnos.[Fecha Ingreso], Grupos.Clave
FROM (Cursos INNER JOIN ProgramacionExamenes ON Cursos.Curso = ProgramacionExamenes.curso) INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo = Grupos.Clave) ON Cursos.Curso = Grupos.Curso
WHERE (((ProgramacionExamenes.FechaExamen)>=Now()) AND ((DateDiff("m",[Alumnos].[Fecha Ingreso],[ProgramacionExamenes].[FechaExamen]))>5) AND ((Alumnos.[Fecha Baja]) Is Null))
ORDER BY ProgramacionExamenes.ClaveExamen;
