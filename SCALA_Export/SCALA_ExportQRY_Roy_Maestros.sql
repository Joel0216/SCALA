SELECT DISTINCTROW Grupos.Curso, Count(Maestros.Nombre) AS CuentaDeNombre
FROM Grupos INNER JOIN Maestros ON (Grupos.Maestro=Maestros.Nombre) AND (Grupos.Maestro=Maestros.Nombre)
WHERE (((Maestros.[Fecha de ingreso])<=[Fecha Final]))
GROUP BY Grupos.Curso
ORDER BY Grupos.Curso;
