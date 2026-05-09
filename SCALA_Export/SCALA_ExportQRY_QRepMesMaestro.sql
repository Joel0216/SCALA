SELECT DISTINCTROW Grupos.Maestro, [Orden Dias].Orden, Grupos.[Hora entrada], Grupos.Dia, Grupos.Salon, Grupos.Curso, Grupos.Leccion, Grupos.Inicio, Grupos.Alumnos
FROM Grupos INNER JOIN [Orden Dias] ON Grupos.Dia=[Orden Dias].Dia
ORDER BY Grupos.Maestro, [Orden Dias].Orden, Grupos.[Hora entrada], Grupos.Dia
WITH OWNERACCESS OPTION;
