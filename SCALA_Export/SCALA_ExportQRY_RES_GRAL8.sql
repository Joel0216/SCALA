SELECT DISTINCTROW Count(Maestros.Nombre) AS CountOfNombre
FROM Maestros
WHERE (((Maestros.[Fecha de ingreso])<=[FECHA FIN : ]))
WITH OWNERACCESS OPTION;
