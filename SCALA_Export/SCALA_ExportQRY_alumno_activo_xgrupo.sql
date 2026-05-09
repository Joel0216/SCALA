SELECT DISTINCTROW Alumnos.Credencial, Alumnos.Nombre, Alumnos.email, Grupos.Clave, Grupos.Curso, Alumnos.FechadeNacimiento, Alumnos.Telefono, Alumnos.Nombre_madre
FROM Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo
WHERE (((Alumnos.[Fecha Baja]) Is Null))
WITH OWNERACCESS OPTION;
