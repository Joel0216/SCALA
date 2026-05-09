SELECT DISTINCTROW Count(Colegiaturas.AlumnoID) AS CuentaDeAlumnoID, Sum(Colegiaturas.Precio) AS SumaDePrecio, Colegiaturas.Curso, Cursos.Costo
FROM (Colegiaturas INNER JOIN Recibos ON Colegiaturas.Recibo=Recibos.Numero) INNER JOIN Cursos ON Colegiaturas.Curso=Cursos.Curso
WHERE (((Recibos.Fecha) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Colegiaturas.Curso, Cursos.Costo
ORDER BY Colegiaturas.Curso;
