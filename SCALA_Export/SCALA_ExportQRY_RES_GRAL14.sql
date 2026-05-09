SELECT DISTINCTROW Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha, Alumnos.Credencial, Colegiaturas.Mes, Porcentajes.Factor, Colegiaturas.Precio
FROM (((Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) INNER JOIN (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) ON Alumnos.Credencial=Colegiaturas.AlumnoID) INNER JOIN Porcentajes ON (Grupos.Maestro=Porcentajes.Maestro) AND (Grupos.Curso=Porcentajes.Curso)) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes
WHERE (((Alumnos.[Fecha Baja]) Is Null))
GROUP BY Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha, Alumnos.Credencial, Colegiaturas.Mes, Porcentajes.Factor, Colegiaturas.Precio
HAVING (((Meses.Orden)=12) AND ((Recibos.Fecha)>=[Mayor a que fecha : ] And (Recibos.Fecha)<=[Menor a que fecha :  ]))
ORDER BY Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha
WITH OWNERACCESS OPTION;
