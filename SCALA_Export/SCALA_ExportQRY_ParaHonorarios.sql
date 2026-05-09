SELECT DISTINCTROW Grupos.Maestro, Grupos.Curso, Grupos.Inicio, Grupos.Clave, Alumnos.Credencial, Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha, Maestros.[Fecha de ingreso], Maestros.RFC, Maestros.Grado, Porcentajes.Factor, Grupos.Alumnos, Colegiaturas.Precio, Alumnos.[Fecha Ingreso]
FROM ((((Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) INNER JOIN (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) ON Alumnos.Credencial=Colegiaturas.AlumnoID) INNER JOIN Maestros ON Grupos.Maestro=Maestros.Nombre) INNER JOIN Porcentajes ON (Grupos.Curso=Porcentajes.Curso) AND (Grupos.Maestro=Porcentajes.Maestro)) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes
WHERE (((Grupos.Maestro) Between [Maestro inicial : ] And [Maestro Final : ]) AND ((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Grupos.Maestro, Grupos.Curso, Grupos.Inicio, Grupos.Clave, Alumnos.Credencial, Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha
WITH OWNERACCESS OPTION;
