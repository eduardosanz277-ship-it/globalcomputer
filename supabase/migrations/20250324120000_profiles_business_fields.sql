-- Campos adicionales para cuentas empresa y trigger de alta
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS employer_identification_number text;

COMMENT ON COLUMN public.profiles.phone IS 'Teléfono de contacto (opcional)';
COMMENT ON COLUMN public.profiles.employer_identification_number IS 'EIN / identificación fiscal del negocio';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, employer_identification_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'CLIENT'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'employer_identification_number'), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
