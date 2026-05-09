SELECT DISTINCTROW [Alumno y Grupo].Nombre, Maestros.Clave, [Alumno y Grupo].Credencial, [Alumno y Grupo].dig_ver, [Alumno y Grupo].Telefono, [Alumno y Grupo].Grupo, [Alumno y Grupo].[Fecha Ingreso], [Alumno y Grupo].Grado, [Alumno y Grupo].Curso, [Alumno y Grupo].Maestro, [Alumno y Grupo].Dia, [Alumno y Grupo].[Hora entrada], [Alumno y Grupo].[Hora salida], [Alumno y Grupo].Salon, [Alumno y Grupo].Grupo, [Alumno y Grupo].Inicio
FROM [Alumno y Grupo] INNER JOIN Maestros ON [Alumno y Grupo].Maestro=Maestros.Nombre
WHERE (((Maestros.Clave)=[ClaveMaestro]))
ORDER BY [Alumno y Grupo].Nombre
WITH OWNERACCESS OPTION;
