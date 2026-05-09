SELECT DISTINCTROW [Orden Dias].Orden, Grupos.Dia, Grupos.[Hora entrada], Grupos.Salon, Grupos.Clave, Grupos.Alumnos, Grupos.Leccion, Grupos.Curso
FROM Grupos INNER JOIN [Orden Dias] ON Grupos.Dia=[Orden Dias].Dia
GROUP BY [Orden Dias].Orden, Grupos.Dia, Grupos.[Hora entrada], Grupos.Salon, Grupos.Clave, Grupos.Alumnos, Grupos.Leccion, Grupos.Curso
ORDER BY [Orden Dias].Orden, Grupos.[Hora entrada], Grupos.Salon, Grupos.Clave;
