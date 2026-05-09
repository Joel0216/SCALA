SELECT DISTINCTROW Recibos.Numero, Recibos.Monto, Recibos.Pago, Operaciones.IVA, Operaciones.Operacion, Operaciones.Credencial, Operaciones.Cantidad, Operaciones.Neto, Recibos.FacturacionNombre, Recibos.Facturaciondirec1, Recibos.Facturaciondirec2, Recibos.FacturacionRFC, Recibos.DescuentoGeneral, Operaciones.Descuento
FROM Alumnos INNER JOIN (Recibos INNER JOIN Operaciones ON Recibos.Numero=Operaciones.Recibo) ON Alumnos.Credencial=Operaciones.Credencial
WHERE (((Recibos.Numero)=Forms!Pagos!Numero));
