SELECT DISTINCTROW Grupos.Maestro, Grupos.Curso, Alumnos.Grupo, Grupos.Inicio, Alumnos.Credencial, Alumnos.dig_ver, Alumnos.Nombre, Alumnos.[Fecha Ingreso], Alumnos.Beca, Alumnos.Porcentaje, TablaMedios.DescMedio, tablainstrumento.DescripcionInst, Alumnos.QueInstrumento, Alumnos.Direccion1, Alumnos.Direccion2, Alumnos.Telefono
FROM tablainstrumento RIGHT JOIN (TablaMedios INNER JOIN (Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) ON TablaMedios.QueMedio=Alumnos.QueMedio) ON tablainstrumento.QueInstrumento=Alumnos.QueInstrumento
WHERE (((Alumnos.[Fecha Ingreso]) Between [Inicio de Periodo] And [Fin de Periodo]) AND ((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Grupos.Maestro, Grupos.Curso, Alumnos.Grupo, Alumnos.Credencial
WITH OWNERACCESS OPTION;
