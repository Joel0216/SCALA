SELECT DISTINCTROW Recibos.Pago, Count(Recibos.Numero) AS CountOfNumero, Sum(Recibos.Efectivo) AS SumOfEfectivo, Recibos.Fecha
FROM Recibos INNER JOIN DescPago ON Recibos.Pago=DescPago.Pago
GROUP BY Recibos.Pago, Recibos.Fecha
HAVING (((Recibos.Pago)="1" Or (Recibos.Pago)="3"))
ORDER BY Recibos.Pago
WITH OWNERACCESS OPTION;
