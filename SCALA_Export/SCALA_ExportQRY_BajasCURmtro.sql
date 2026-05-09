SELECT DISTINCTROW Alumnos.Maestro, Count(Alumnos.Credencial) AS CountOfCredencial, [Tabla Motivos].[DESCRIPCION MOTIVO], Alumnos.Motivo, Grupos.Curso
FROM (Alumnos INNER JOIN [Tabla Motivos] ON Alumnos.[Clave Motivo]=[Tabla Motivos].[CLAVE MOTIVO]) INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave
WHERE (((Alumnos.[Fecha Baja]) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Alumnos.Maestro, [Tabla Motivos].[DESCRIPCION MOTIVO], Alumnos.Motivo, Grupos.Curso, Alumnos.[Fecha Baja]
HAVING (((Alumnos.[Fecha Baja]) Is Not Null))
ORDER BY Alumnos.Maestro, Grupos.Curso
WITH OWNERACCESS OPTION;
