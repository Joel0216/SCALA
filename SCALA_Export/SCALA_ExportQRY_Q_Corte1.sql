SELECT DISTINCTROW Operaciones.*, Recibos.Fecha
FROM Operaciones INNER JOIN Recibos ON Operaciones.Recibo=Recibos.Numero
WHERE (((Recibos.Fecha)=[Fecha de Corte]))
WITH OWNERACCESS OPTION;
