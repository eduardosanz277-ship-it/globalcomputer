-- Direcciones: datos de contacto y ubicación ampliados; se elimina el alias (label).
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS apartment text,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.addresses DROP COLUMN IF EXISTS label;

COMMENT ON COLUMN public.addresses.first_name IS 'Nombre del destinatario';
COMMENT ON COLUMN public.addresses.last_name IS 'Apellido del destinatario';
COMMENT ON COLUMN public.addresses.company IS 'Empresa (opcional)';
COMMENT ON COLUMN public.addresses.apartment IS 'Apartamento, suite, unidad, etc.';
COMMENT ON COLUMN public.addresses.phone IS 'Teléfono de contacto';
