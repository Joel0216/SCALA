SELECT DISTINCTROW Alumnos.*, Alumnos.Credencial, Grupos.Curso
FROM Cursos INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave) ON Cursos.Curso=Grupos.Curso
ORDER BY Alumnos.Credencial;
