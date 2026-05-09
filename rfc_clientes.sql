-- ==========================================
-- RFC CLIENTES Y CREDENCIALES
-- Eliminar tablas si existen (¡ATENCIÓN: Esto borrará los datos existentes!)
DROP TABLE IF EXISTS public.rfc_credenciales CASCADE;
DROP TABLE IF EXISTS public.rfc_clientes CASCADE;

-- 1. Tabla rfc_clientes
CREATE TABLE public.rfc_clientes (
    rfc VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    correo VARCHAR(255), -- Added for electronic invoicing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla relacional de credenciales asociadas al RFC
CREATE TABLE public.rfc_credenciales (
    id SERIAL PRIMARY KEY,
    rfc VARCHAR(50) REFERENCES public.rfc_clientes(rfc) ON DELETE CASCADE,
    credencial INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);