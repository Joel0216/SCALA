SELECT DISTINCTROW Alumnos.QueInstrumento, tablainstrumento.DescripcionInst, Alumnos.Credencial, Alumnos.dig_ver, Alumnos.Nombre, Alumnos.Direccion1, Alumnos.Direccion2, Alumnos.Telefono, Grupos.Curso, Alumnos.Grupo, Alumnos.[Fecha Ingreso], Alumnos.QueMedio, TablaMedios.DescMedio, Alumnos.[Fecha Baja]
FROM TablaMedios INNER JOIN ((Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) INNER JOIN tablainstrumento ON Alumnos.QueInstrumento=tablainstrumento.QueInstrumento) ON TablaMedios.QueMedio=Alumnos.QueMedio
WHERE (((Alumnos.[Fecha Ingreso]) Between [Fecha Inicial] And [Fecha Final]) AND ((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Alumnos.QueInstrumento, Alumnos.QueMedio, TablaMedios.DescMedio
WITH OWNERACCESS OPTION;
