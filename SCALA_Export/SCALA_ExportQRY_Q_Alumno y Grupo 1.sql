SELECT DISTINCTROW Alumnos.Comentario, Alumnos.Porcentaje, Alumnos.Beca, Alumnos.Credencial, Alumnos.dig_ver, Grupos.Inicio, Grupos.Clave, Grupos.Salon, Grupos.[Hora salida], Grupos.[Hora entrada], Grupos.Dia, Grupos.Maestro, Grupos.Curso, Alumnos.Grado, Alumnos.[Fecha Ingreso], Alumnos.Grupo, Alumnos.Telefono, Alumnos.Direccion2, Alumnos.Direccion1, Alumnos.Nombre
FROM Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo
WHERE (((Grupos.Curso)=[Nombre del curso]) AND ((Alumnos.[Fecha Baja]) Is Null))
WITH OWNERACCESS OPTION;
