-- Agrega las columnas para Clases Extra
ALTER TABLE sesiones_clase 
ADD COLUMN IF NOT EXISTS es_extra BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_extra TEXT,
ADD COLUMN IF NOT EXISTS salon_extra VARCHAR(20);

-- Esta función checa si un salón está libre para una clase extra en una fecha/hora específica
CREATE OR REPLACE FUNCTION check_salon_disponible(p_salon VARCHAR(20), p_fecha DATE, p_hora_inicio TIME)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_dia VARCHAR(2);
    v_ocupado BOOLEAN;
BEGIN
    -- Determinar el día de la semana (LU, MA, MI, JU, VI, SA, DO)
    SELECT CASE EXTRACT(ISODOW FROM p_fecha)
        WHEN 1 THEN 'LU' WHEN 2 THEN 'MA' WHEN 3 THEN 'MI'
        WHEN 4 THEN 'JU' WHEN 5 THEN 'VI' WHEN 6 THEN 'SA'
        WHEN 7 THEN 'DO'
    END INTO v_dia;

    -- Verificar si existe un grupo regular en ese salón y hora
    SELECT EXISTS (
        SELECT 1 FROM grupos
        WHERE salon_id = p_salon
          AND dia = v_dia
          AND activo = true
          AND p_hora_inicio >= hora_entrada::time
          AND p_hora_inicio < hora_salida::time
    ) INTO v_ocupado;

    IF v_ocupado THEN
        RETURN FALSE;
    END IF;

    -- Verificar si ya hay OTRA sesión extra en ese mismo salón y fecha que siga iniciada
    -- Aquí asumo que las clases duran aprox 1 hora u ocupan la hora actual.
    SELECT EXISTS (
        SELECT 1 FROM sesiones_clase
        WHERE salon_extra = p_salon
          AND fecha = p_fecha
          AND estatus = 'INICIADA'
    ) INTO v_ocupado;

    IF v_ocupado THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;
