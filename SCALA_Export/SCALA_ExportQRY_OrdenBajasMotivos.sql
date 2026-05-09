SELECT DISTINCTROW Alumnos.[Clave Motivo], Alumnos.Motivo, Alumnos.Credencial, Alumnos.dig_ver, Alumnos.Nombre, Alumnos.[Fecha Baja]
FROM Alumnos
WHERE (((Alumnos.[Fecha Baja]) Between [Fecha Inicio : ] And [Fecha Fin : ]))
ORDER BY Alumnos.[Clave Motivo], Alumnos.Motivo
WITH OWNERACCESS OPTION;
