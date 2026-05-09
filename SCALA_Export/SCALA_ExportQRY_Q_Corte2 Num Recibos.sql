SELECT DISTINCTROW Count(Recibos.Numero) AS CuentaDeNumero, Min(Recibos.Numero) AS MínDeNumero, Max(Recibos.Numero) AS MáxDeNumero, Recibos.Fecha
FROM Recibos
GROUP BY Recibos.Fecha
WITH OWNERACCESS OPTION;
