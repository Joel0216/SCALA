SELECT DISTINCTROW Count(Cambios.Credencial) AS CuentaDeCredencial, Cambios.[Curso Anterior]
FROM Cambios
WHERE (((Cambios.Fecha) Between [Fecha Inicial] And [Fecha Final]))
GROUP BY Cambios.[Curso Anterior]
ORDER BY Cambios.[Curso Anterior];
