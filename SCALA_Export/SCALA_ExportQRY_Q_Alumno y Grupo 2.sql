SELECT DISTINCTROW Alumnos.Comentario, Alumnos.Porcentaje, Alumnos.Beca, Count(Alumnos.Credencial) AS CuentaDeCredencial, Grupos.Inicio, Grupos.Clave, Grupos.Salon, Grupos.[Hora salida], Grupos.[Hora entrada], Grupos.Dia, Grupos.Maestro, Grupos.Curso, Alumnos.Grado, Alumnos.[Fecha Ingreso], Alumnos.Grupo, Alumnos.Telefono, Alumnos.Direccion2, Alumnos.Direccion1, Alumnos.Nombre
FROM Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo
GROUP BY Alumnos.Comentario, Alumnos.Porcentaje, Alumnos.Beca, Grupos.Inicio, Grupos.Clave, Grupos.Salon, Grupos.[Hora salida], Grupos.[Hora entrada], Grupos.Dia, Grupos.Maestro, Grupos.Curso, Alumnos.Grado, Alumnos.[Fecha Ingreso], Alumnos.Grupo, Alumnos.Telefono, Alumnos.Direccion2, Alumnos.Direccion1, Alumnos.Nombre
ORDER BY Grupos.Maestro
WITH OWNERACCESS OPTION;
