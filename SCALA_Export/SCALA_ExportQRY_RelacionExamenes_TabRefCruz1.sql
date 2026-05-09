TRANSFORM Count(RelacionExamenes.SePresento) AS [El valor]
SELECT RelacionExamenes.ClaveExamen, RelacionExamenes.GradoNivel, ProgramacionExamenes.FechaExamen, ProgramacionExamenes.TipoExamen, ProgramacionExamenes.Examinador1, ProgramacionExamenes.Examinador2, Count(RelacionExamenes.[Certificado Num]) AS [CuentaDeCertificado Num], Count(RelacionExamenes.Credencial) AS CuentaDeCredencial
FROM ProgramacionExamenes INNER JOIN RelacionExamenes ON ProgramacionExamenes.ClaveExamen=RelacionExamenes.ClaveExamen
GROUP BY RelacionExamenes.ClaveExamen, RelacionExamenes.GradoNivel, ProgramacionExamenes.FechaExamen, ProgramacionExamenes.TipoExamen, ProgramacionExamenes.Examinador1, ProgramacionExamenes.Examinador2
ORDER BY ProgramacionExamenes.FechaExamen, ProgramacionExamenes.TipoExamen
PIVOT RelacionExamenes.SePresento;
