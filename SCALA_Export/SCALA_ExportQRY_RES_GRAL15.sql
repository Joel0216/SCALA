SELECT DISTINCTROW Colegiaturas.AlumnoID, Colegiaturas.Precio, Colegiaturas.Recibo
FROM (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes
WHERE (((Recibos.Fecha) Between [FECHA DE INICIO : ] And [FECHA FIN : ]))
GROUP BY Colegiaturas.AlumnoID, Colegiaturas.Precio, Colegiaturas.Recibo
ORDER BY Colegiaturas.AlumnoID
WITH OWNERACCESS OPTION;
