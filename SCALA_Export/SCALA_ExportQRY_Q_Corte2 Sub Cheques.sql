SELECT DISTINCTROW Recibos.Pago, DescPago.DescPago, Recibos.Numero, Recibos.tarjeta_referencia AS DatosCheque, Recibos.tarjeta AS Cheque, Recibos.Fecha
FROM Recibos INNER JOIN DescPago ON Recibos.Pago=DescPago.Pago
WHERE (((Recibos.Pago)="2" Or (Recibos.Pago)="3" Or (Recibos.Pago)="4" Or (Recibos.Pago)="5"))
ORDER BY Recibos.Pago, Recibos.Numero
WITH OWNERACCESS OPTION;
