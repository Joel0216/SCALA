-- Update maestros table for mobile authentication
ALTER TABLE maestros 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS credencial_id TEXT,
ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT false;

-- Index for authentication lookups
CREATE INDEX IF NOT EXISTS idx_maestros_auth ON maestros(clave, credencial_id);

COMMENT ON COLUMN maestros.password_hash IS 'Hashed password for mobile login';
COMMENT ON COLUMN maestros.credencial_id IS 'Verification credential ID for initial registration';
COMMENT ON COLUMN maestros.is_registered IS 'Flag to check if the teacher has already created an account';
