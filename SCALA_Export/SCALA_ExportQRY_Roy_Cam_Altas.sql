SELECT DISTINCTROW Count(Cambios.Credencial) AS CuentaDeCredencial, Cambios.[Curso Nuevo]
FROM Cambios
WHERE (((Cambios.Fecha) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Cambios.[Curso Nuevo]
ORDER BY Cambios.[Curso Nuevo];
