SELECT Alumnos.Nombre, Alumnos.Credencial, Cursos.curso_siguiente, Alumnos.Grupo, Grupos.Curso, ProgramacionExamenes.ClaveExamen
FROM (ProgramacionExamenes INNER JOIN Cursos ON ProgramacionExamenes.curso=Cursos.Curso) INNER JOIN (RelacionExamenes INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave) ON RelacionExamenes.Credencial=Alumnos.Credencial) ON (ProgramacionExamenes.ClaveExamen=RelacionExamenes.ClaveExamen) AND (Cursos.Curso=Grupos.Curso)
WHERE (((RelacionExamenes.Aprobo)=True) And ((ProgramacionExamenes.curso)=Grupos.Curso) And ((Alumnos.[Fecha Baja]) Is Null));
