SELECT [RFC Credenciales].Credencial, [RFC Clientes].RFC, [RFC Clientes].Nombre, [RFC Clientes].Direccion1, [RFC Clientes].Direccion2
FROM [RFC Credenciales] INNER JOIN [RFC Clientes] ON [RFC Credenciales].RFC=[RFC Clientes].RFC;
