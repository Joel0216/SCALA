SELECT DISTINCTROW TablaMedios.QueMedio, TablaMedios.DescMedio, Count(Alumnos.Credencial) AS CuentaDeCredencial
FROM TablaMedios INNER JOIN Alumnos ON TablaMedios.QueMedio=Alumnos.QueMedio
WHERE (((Alumnos.[Fecha Ingreso]) Between [Inicio de Periodo] And [Fin de Periodo]))
GROUP BY TablaMedios.QueMedio, TablaMedios.DescMedio
ORDER BY TablaMedios.QueMedio, TablaMedios.DescMedio;
