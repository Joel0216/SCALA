SELECT DISTINCTROW RelacionExamenes.ClaveExamen, RelacionExamenes.Horario, RelacionExamenes.Credencial, RelacionExamenes.*
FROM RelacionExamenes
ORDER BY RelacionExamenes.ClaveExamen, RelacionExamenes.Horario, RelacionExamenes.Credencial;
