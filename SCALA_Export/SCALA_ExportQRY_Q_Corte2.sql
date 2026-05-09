SELECT DISTINCTROW Operaciones.Grupo, Count(Operaciones.Recibo) AS CuentaDeRecibo, Sum(Operaciones.IVA) AS SumaDeIVA, Sum(Operaciones.Neto) AS SumaDeNeto
FROM Operaciones INNER JOIN Recibos ON Operaciones.Recibo=Recibos.Numero
WHERE (((Recibos.Fecha)=[FechaCorte]))
GROUP BY Operaciones.Grupo
ORDER BY Operaciones.Grupo, Count(Operaciones.Recibo)
WITH OWNERACCESS OPTION;
