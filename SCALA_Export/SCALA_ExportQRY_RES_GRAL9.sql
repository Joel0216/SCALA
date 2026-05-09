SELECT DISTINCTROW Operaciones.Grupo, Sum(Operaciones.Cantidad) AS SumaDeCantidad, Sum(Operaciones.Neto) AS SumOfNeto, Sum(Operaciones.IVA) AS SumOfIVA
FROM Operaciones INNER JOIN Recibos ON Operaciones.Recibo=Recibos.Numero
WHERE (((Recibos.Fecha) Between [FECHA DE INICIO : ] And [FECHA FIN : ]))
GROUP BY Operaciones.Grupo
ORDER BY Operaciones.Grupo
WITH OWNERACCESS OPTION;
