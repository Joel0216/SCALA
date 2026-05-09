SELECT DISTINCTROW Colegiaturas.AlumnoID, Colegiaturas.AñoP, Meses.Orden, Colegiaturas.Mes, Colegiaturas.*, Recibos.Fecha
FROM (Meses INNER JOIN Colegiaturas ON Meses.Mes=Colegiaturas.Mes) INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero
ORDER BY Colegiaturas.AlumnoID, Colegiaturas.AñoP DESC , Meses.Orden DESC;
