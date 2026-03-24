-- Aprobación de cuentas empresa por administración
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_registration_status text;

COMMENT ON COLUMN public.profiles.business_registration_status IS
  'Empresa: pending | approved | rejected. NULL si no aplica (CLIENT/ADMIN).';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_business_registration_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_business_registration_status_check
  CHECK (
    business_registration_status IS NULL
    OR business_registration_status IN ('pending', 'approved', 'rejected')
  );

UPDATE public.profiles
SET business_registration_status = 'approved'
WHERE role = 'BUSINESS'
  AND business_registration_status IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'CLIENT');

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    phone,
    employer_identification_number,
    business_registration_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'employer_identification_number'), ''),
    CASE WHEN v_role = 'BUSINESS' THEN 'pending' ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.business_login_block_reason(check_email text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.business_registration_status
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE lower(u.email) = lower(trim(check_email))
    AND p.role = 'BUSINESS'
    AND COALESCE(p.business_registration_status, 'approved') <> 'approved'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.business_login_block_reason(text) TO anon;
GRANT EXECUTE ON FUNCTION public.business_login_block_reason(text) TO authenticated;
