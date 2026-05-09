SELECT DISTINCTROW Recibos.Fecha, Colegiaturas.*
FROM Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero
WHERE (((Recibos.Fecha)>Date()-90))
ORDER BY Recibos.Fecha DESC
WITH OWNERACCESS OPTION;
