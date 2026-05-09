SELECT DISTINCTROW Operaciones.*, Recibos.Fecha, [Grupos Articulos].Flag1
FROM [Grupos Articulos] INNER JOIN (Operaciones INNER JOIN Recibos ON Operaciones.Recibo=Recibos.Numero) ON [Grupos Articulos].Grupo=Operaciones.Grupo
WHERE (((Recibos.Fecha) Between [Fecha inicial] And [Fecha Final]) AND (([Grupos Articulos].Flag1)=True))
WITH OWNERACCESS OPTION;
