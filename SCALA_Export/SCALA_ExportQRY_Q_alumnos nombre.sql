SELECT DISTINCTROW Alumnos.*, Alumnos.Nombre, Grupos.Curso
FROM Cursos INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave) ON Cursos.Curso=Grupos.Curso
WHERE (((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Alumnos.Nombre;
