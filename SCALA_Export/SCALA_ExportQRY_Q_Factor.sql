SELECT DISTINCTROW Maestros.*, Porcentajes.*
FROM Porcentajes INNER JOIN Maestros ON Porcentajes.Maestro=Maestros.Nombre;
