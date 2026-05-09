SELECT DISTINCTROW Grupos.Maestro, Grupos.Curso, Grupos.Inicio, Grupos.Clave, Meses.Orden, Colegiaturas.AñoP, Recibos.Fecha, Alumnos.Credencial, Maestros.[Fecha de ingreso], Maestros.RFC, Maestros.Grado, Porcentajes.Factor, Grupos.Alumnos, Colegiaturas.Precio, Alumnos.[Fecha Ingreso]
FROM (Alumnos INNER JOIN ((Grupos INNER JOIN Maestros ON Grupos.Maestro=Maestros.Nombre) INNER JOIN Porcentajes ON (Grupos.Curso=Porcentajes.Curso) AND (Grupos.Maestro=Porcentajes.Maestro)) ON Alumnos.Grupo=Grupos.Clave) INNER JOIN ((Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes) ON Alumnos.Credencial=Colegiaturas.AlumnoID
WHERE (((Recibos.Fecha) Between [FECHA DE INICIO : ] And [FECHA FIN : ]) AND ((Alumnos.[Fecha Baja]) Is Not Null))
ORDER BY Grupos.Maestro, Grupos.Curso, Grupos.Inicio, Grupos.Clave, Meses.Orden, Colegiaturas.AñoP, Recibos.Fecha
WITH OWNERACCESS OPTION;
