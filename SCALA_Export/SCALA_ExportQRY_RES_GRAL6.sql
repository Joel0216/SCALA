SELECT DISTINCTROW Count(Grupos.Clave) AS CountOfClave
FROM Grupos
WHERE (((Grupos.Inicio)<=[FECHA FIN : ]))
WITH OWNERACCESS OPTION;
