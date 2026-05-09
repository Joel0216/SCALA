SELECT DISTINCTROW Grupos.Maestro, Grupos.Curso, Grupos.Clave, Alumnos.Nombre, Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha, Grupos.Alumnos, Grupos.Inicio, Grupos.Salon, Alumnos.Credencial, Alumnos.dig_ver, Alumnos.[Fecha Ingreso], Alumnos.Telefono, Colegiaturas.Precio, Alumnos.Porcentaje
FROM (((Grupos INNER JOIN Alumnos ON Grupos.Clave=Alumnos.Grupo) INNER JOIN (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) ON Alumnos.Credencial=Colegiaturas.AlumnoID) INNER JOIN Maestros ON Grupos.Maestro=Maestros.Nombre) INNER JOIN Meses ON Colegiaturas.Mes=Meses.Mes
WHERE (((Colegiaturas.AñoP)>=[Año Pago Adelantado : ]) AND ((Meses.Orden)>=[Mes Pago Adelantado : ]) AND ((Alumnos.[Fecha Ingreso])>[Fecha corte]))
ORDER BY Grupos.Maestro, Grupos.Curso, Grupos.Clave, Alumnos.Nombre, Colegiaturas.AñoP, Meses.Orden, Recibos.Fecha
WITH OWNERACCESS OPTION;
