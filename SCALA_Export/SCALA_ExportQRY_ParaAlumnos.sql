SELECT DISTINCTROW Grupos.Maestro, Grupos.Curso, Grupos.Clave, Alumnos.Credencial, Alumnos.Nombre, Meses.Orden, Colegiaturas.AñoP, Recibos.Fecha, Grupos.Alumnos, Grupos.Inicio, Grupos.Salon, Alumnos.dig_ver, Alumnos.[Fecha Ingreso], Alumnos.Telefono, Colegiaturas.Precio, Alumnos.Porcentaje
FROM (((Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) INNER JOIN (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) ON Alumnos.Credencial=Colegiaturas.AlumnoID) INNER JOIN Maestros ON Grupos.Maestro=Maestros.Nombre) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes
WHERE (((Grupos.Maestro) Between [Maestro Inicial : ] And [Maestro Final : ]) AND ((Alumnos.[Fecha Baja]) Is Null))
ORDER BY Grupos.Maestro, Grupos.Curso, Grupos.Clave, Alumnos.Credencial, Alumnos.Nombre, Meses.Orden, Colegiaturas.AñoP, Recibos.Fecha
WITH OWNERACCESS OPTION;
