-- =============================================
-- Reset password de TODOS los ADMIN reales por rol (no por email)
-- Password: Admin*2026!
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  encrypted_pwd text;
BEGIN
  BEGIN
    encrypted_pwd := extensions.crypt(
      'Admin*2026!'::text,
      extensions.gen_salt('bf'::text)
    );
  EXCEPTION WHEN undefined_function THEN
    encrypted_pwd := public.crypt(
      'Admin*2026!'::text,
      public.gen_salt('bf'::text)
    );
  END;

  UPDATE auth.users u
  SET encrypted_password = encrypted_pwd,
      email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
      updated_at = now()
  WHERE u.id IN (SELECT id FROM public.profiles WHERE role = 'ADMIN');
END;
$$;

