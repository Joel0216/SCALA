SELECT DISTINCTROW Count(Recibos.Numero) AS CountOfNumero, Sum(Recibos.Monto) AS SumOfMonto, Sum(Recibos.IVA) AS SumOfIVA
FROM Recibos
WHERE (((Recibos.Fecha) Between [FECHA DE INICIO : ] And [FECHA FIN : ]))
WITH OWNERACCESS OPTION;
