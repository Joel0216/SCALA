SELECT DISTINCTROW Operaciones.*, Recibos.Fecha, [Grupos Articulos].Flag1
FROM (Operaciones INNER JOIN Recibos ON Operaciones.Recibo=Recibos.Numero) INNER JOIN [Grupos Articulos] ON Operaciones.Grupo=[Grupos Articulos].Grupo
WHERE (((Recibos.Fecha)=[Fecha de corte]) AND (([Grupos Articulos].Flag1)=True))
WITH OWNERACCESS OPTION;
