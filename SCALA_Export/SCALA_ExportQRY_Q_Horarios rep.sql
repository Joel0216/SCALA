SELECT DISTINCTROW [Orden Dias].Orden, Cursos.Curso, Grupos.Dia, Grupos.[Hora entrada], Grupos.FechaLeccion, Grupos.Leccion, Grupos.Clave, Grupos.Maestro, Grupos.Salon, Grupos.[Hora salida], Grupos.Inicio, Grupos.Maestro, Grupos.Maestro, Grupos.Cupo, Grupos.Alumnos
FROM Cursos INNER JOIN (Grupos INNER JOIN [Orden Dias] ON Grupos.Dia=[Orden Dias].Dia) ON Cursos.Curso=Grupos.Curso
ORDER BY [Orden Dias].Orden, Cursos.Curso, Grupos.[Hora entrada]
WITH OWNERACCESS OPTION;
