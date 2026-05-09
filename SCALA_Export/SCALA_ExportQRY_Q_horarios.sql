SELECT DISTINCTROW Grupos.Curso, [Orden Dias].Orden, Grupos.Dia, Grupos.[Hora entrada], Grupos.Clave, Grupos.Maestro, Grupos.Salon, Grupos.Cupo, Grupos.Alumnos, Grupos.Inicio, Grupos.Leccion, Grupos.FechaLeccion
FROM Grupos INNER JOIN [Orden Dias] ON Grupos.Dia=[Orden Dias].Dia
ORDER BY Grupos.Curso, [Orden Dias].Orden, Grupos.[Hora entrada];
