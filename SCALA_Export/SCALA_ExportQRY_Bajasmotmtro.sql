SELECT DISTINCTROW Alumnos.Maestro, Alumnos.[Clave Motivo], [Tabla Motivos].[DESCRIPCION MOTIVO], Count(Alumnos.Credencial) AS CountOfCredencial
FROM Alumnos INNER JOIN [Tabla Motivos] ON Alumnos.[Clave Motivo]=[Tabla Motivos].[CLAVE MOTIVO]
WHERE (((Alumnos.[Fecha Baja]) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Alumnos.Maestro, Alumnos.[Clave Motivo], [Tabla Motivos].[DESCRIPCION MOTIVO]
ORDER BY Alumnos.Maestro, Alumnos.[Clave Motivo]
WITH OWNERACCESS OPTION;
