SELECT DISTINCTROW Recibos.Pago, Count(Operaciones.ID) AS CountOfID, Sum(Operaciones.Neto) AS SumOfNeto, Sum(Operaciones.IVA) AS SumOfIVA
FROM Operaciones INNER JOIN Recibos ON Operaciones.Recibo=Recibos.Numero
WHERE (((Recibos.Fecha) Between [FECHA DE INICIO : ] And [FECHA FIN : ]))
GROUP BY Recibos.Pago
WITH OWNERACCESS OPTION;
