SELECT DISTINCTROW ProgramacionExamenes.TipoExamen, RelacionExamenes.GradoNivel, Count(RelacionExamenes.GradoNivel) AS CuentaDeGradoNivel, ProgramacionExamenes.FechaExamen
FROM ProgramacionExamenes INNER JOIN RelacionExamenes ON ProgramacionExamenes.ClaveExamen=RelacionExamenes.ClaveExamen
GROUP BY ProgramacionExamenes.TipoExamen, RelacionExamenes.GradoNivel, ProgramacionExamenes.FechaExamen
HAVING (((ProgramacionExamenes.TipoExamen)=[Tipo de Examen]) AND ((ProgramacionExamenes.FechaExamen) Between [Fecha Inicial] And [Fecha Final]))
ORDER BY RelacionExamenes.GradoNivel;
