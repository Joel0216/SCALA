SELECT DISTINCTROW Recibos.*
FROM Recibos
WHERE (((Recibos.Fecha)=[Fecha de Corte]))
ORDER BY Recibos.Numero;
