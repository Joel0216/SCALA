SELECT DISTINCTROW Alumnos.Nombre, Cambios.Fecha, Cambios.Credencial, Cambios.Dig_ver, Cambios.[Grupo Anterior], Cambios.[Grupo Nuevo], Cambios.Motivo, Cambios.[Curso Anterior], Cambios.[Curso Nuevo]
FROM Cambios INNER JOIN Alumnos ON Cambios.Credencial=Alumnos.Credencial
WHERE (((Cambios.Fecha) Between [Fecha inicial] And [fecha final]) AND ((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Cambios.Credencial
WITH OWNERACCESS OPTION;
