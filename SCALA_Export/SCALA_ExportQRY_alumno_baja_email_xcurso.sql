SELECT DISTINCTROW Alumnos.Credencial, Alumnos.Nombre, Alumnos.email, Grupos.Clave, Grupos.Curso, Alumnos.[Fecha Baja]
FROM Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo
WHERE (((Alumnos.email) Is Not Null) AND ((Alumnos.[Fecha Baja]) Is Not Null))
WITH OWNERACCESS OPTION;
