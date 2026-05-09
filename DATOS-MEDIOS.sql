-- ==============================================================================
-- DATOS INICIALES PARA MEDIOS DE CONTACTO (Exportado de TablaMedios.xls)
-- ==============================================================================

INSERT INTO public.medios_contacto (clave, descripcion) VALUES
('ANUN', 'ANUNCIO EXTERIOR'),
('BLIV', 'BECA LIVERPOOL'),
('BOTR', 'BECA OTROS'),
('BPH', 'BECA PALACIO DE HIERRO'),
('BSEA', 'BECA SEARS'),
('BSYR', 'BECA SALINAS Y ROCHA'),
('CONC', 'POR CONCIERTO'),
('DIR', 'DIRECTORIO'),
('DY', 'DIARIO DE YUCATAN'),
('EVE', 'EVENTO'),
('FACE', 'FACEBOOK'),
('FOLL', 'POR FOLLETO'),
('INT', 'INTERNET'),
('PERI', 'PERIODICO'),
('POST', 'POSTER'),
('PROM', 'POR PROMOCION'),
('RADI', 'RADIO'),
('REC', 'RECOMENDACION'),
('REI', 'REINSCRIPCION'),
('REVI', 'REVISTA LOCAL'),
('T.V.', 'TELEVISION'),
('VOLA', 'VOLANTE')
ON CONFLICT (clave) DO UPDATE SET descripcion = EXCLUDED.descripcion;
