-- Trigger handle_new_user: rol desde app_metadata; teléfono y EIN con fallbacks (snake/camel).
-- RPC business_login_block_reason: NULL en empresa = pendiente (no aprobado por defecto).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_phone text;
  v_ein text;
BEGIN
  v_role := COALESCE(
    NULLIF(upper(trim(NEW.raw_app_meta_data->>'role')), ''),
    NULLIF(upper(trim(NEW.raw_user_meta_data->>'role')), ''),
    'CLIENT'
  );
  IF v_role NOT IN ('BUSINESS', 'ADMIN', 'CLIENT') THEN
    v_role := 'CLIENT';
  END IF;

  v_phone := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'Phone'), '')
  );

  v_ein := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'employer_identification_number'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'employerIdentificationNumber'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'ein'), '')
  );

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
    NULLIF(v_phone, ''),
    NULLIF(v_ein, ''),
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
  SELECT COALESCE(p.business_registration_status, 'pending')::text
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE lower(u.email) = lower(trim(check_email))
    AND p.role = 'BUSINESS'
    AND COALESCE(p.business_registration_status, 'pending') <> 'approved'
  LIMIT 1;
$$;

-- Filas legacy con NULL: tratar como pendiente explícito
UPDATE public.profiles
SET business_registration_status = 'pending'
WHERE role = 'BUSINESS'
  AND business_registration_status IS NULL;
