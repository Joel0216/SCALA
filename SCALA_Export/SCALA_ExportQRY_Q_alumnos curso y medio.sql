SELECT DISTINCTROW Alumnos.*, Grupos.Curso, Alumnos.QueInstrumento, Alumnos.Credencial
FROM Cursos INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave) ON Cursos.Curso=Grupos.Curso
ORDER BY Grupos.Curso, Alumnos.QueInstrumento;
