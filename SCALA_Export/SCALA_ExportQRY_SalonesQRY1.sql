SELECT DISTINCTROW [Orden Dias].*, Grupos.*, Salones.*
FROM [Orden Dias] INNER JOIN (Grupos INNER JOIN Salones ON Grupos.Salon=Salones.Salon) ON [Orden Dias].Dia=Grupos.Dia
WITH OWNERACCESS OPTION;
