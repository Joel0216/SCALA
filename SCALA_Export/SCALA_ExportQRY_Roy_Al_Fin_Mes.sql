SELECT DISTINCTROW Count(Alumnos.Credencial) AS CuentaDeCredencial, Grupos.Curso, Cursos.Costo
FROM Cursos INNER JOIN (Alumnos INNER JOIN Grupos ON Alumnos.Grupo=Grupos.Clave) ON Cursos.Curso=Grupos.Curso
WHERE (((Alumnos.[Fecha Ingreso])<=[Fecha Final]))
GROUP BY Grupos.Curso, Cursos.Costo
ORDER BY Grupos.Curso;
