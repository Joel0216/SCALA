SELECT DISTINCTROW Colegiaturas.AlumnoID, Colegiaturas.Dig_ver, Recibos.Hora, Colegiaturas.Precio, Colegiaturas.Mes, Colegiaturas.Descuento, Colegiaturas.Grupo, Colegiaturas.Recibo, Colegiaturas.Curso, Recibos.Fecha, Colegiaturas.AñoP
FROM Recibos INNER JOIN Colegiaturas ON Recibos.Numero=Colegiaturas.Recibo
WHERE (((Recibos.Fecha) Between [Fecha inicial] And [Fecha Final]))
ORDER BY Recibos.Fecha
WITH OWNERACCESS OPTION;
