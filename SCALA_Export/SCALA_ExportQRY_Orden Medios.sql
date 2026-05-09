SELECT DISTINCTROW Alumnos.QueMedio, TablaMedios.DescMedio, Alumnos.Credencial, Alumnos.dig_ver, Alumnos.Nombre, Alumnos.Direccion1, Alumnos.Direccion2, Alumnos.Telefono, Grupos.Curso, Alumnos.Grupo, Alumnos.[Fecha Ingreso]
FROM (Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) INNER JOIN TablaMedios ON Alumnos.QueMedio=TablaMedios.QueMedio
WHERE (((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Alumnos.Direccion1
WITH OWNERACCESS OPTION;
