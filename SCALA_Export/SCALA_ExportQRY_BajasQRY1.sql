SELECT DISTINCTROW Alumnos.*, Alumnos.[Fecha Baja], Grupos.Curso
FROM Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave
WHERE (((Alumnos.[Fecha Baja]) Between [Fecha Inicial] And [Fecha Final] And (Alumnos.[Fecha Baja]) Is Not Null))
WITH OWNERACCESS OPTION;
