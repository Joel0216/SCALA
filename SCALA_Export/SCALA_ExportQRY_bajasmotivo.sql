SELECT DISTINCTROW Alumnos_bajas.Nombre, tablainstrumento.DescripcionInst, Grupos.Curso, Alumnos_bajas.QueMedio, TablaMedios.DescMedio, Alumnos_bajas.[Fecha Ingreso], Alumnos_bajas.[Fecha Baja], Alumnos_bajas.Motivo
FROM Grupos, TablaMedios INNER JOIN (tablainstrumento INNER JOIN Alumnos_bajas ON tablainstrumento.QueInstrumento = Alumnos_bajas.QueInstrumento) ON TablaMedios.QueMedio = Alumnos_bajas.QueMedio
WHERE (((Alumnos_bajas.[Fecha Ingreso]) Between [Fecha Inicial] And [Fecha Final]))
ORDER BY tablainstrumento.DescripcionInst, Grupos.Curso, Alumnos_bajas.QueMedio, TablaMedios.DescMedio, Alumnos_bajas.Motivo
WITH OWNERACCESS OPTION;
