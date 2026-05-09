SELECT DISTINCTROW [Orden Dias].Orden, Maestros.Nombre, Grupos.FechaLeccion, Grupos.Leccion, Grupos.Inicio, Grupos.Alumnos, Grupos.Cupo, Grupos.Salon, Grupos.[Hora salida], Grupos.[Hora entrada], Grupos.Dia, Grupos.Curso, Maestros.Clave
FROM [Orden Dias] INNER JOIN (Maestros INNER JOIN Grupos ON Maestros.Nombre=Grupos.Maestro) ON [Orden Dias].Dia=Grupos.Dia
ORDER BY [Orden Dias].Orden
WITH OWNERACCESS OPTION;
