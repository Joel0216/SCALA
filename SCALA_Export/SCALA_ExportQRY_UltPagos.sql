SELECT DISTINCTROW Max((Str([añoP])+Str([orden]))) AS Expr1, Colegiaturas.AlumnoID, Last(Colegiaturas.Precio) AS LastOfPrecio, Last(Colegiaturas.AñoP) AS LastOfAñoP, Last(Colegiaturas.Mes) AS LastOfMes, Last(Recibos.Fecha) AS LastOfFecha, Last(Colegiaturas.Grupo) AS LastOfGrupo, Last(Colegiaturas.Recibo) AS LastOfRecibo
FROM (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes
GROUP BY Colegiaturas.AlumnoID
ORDER BY Max((Str([añoP])+Str([orden])))
WITH OWNERACCESS OPTION;
