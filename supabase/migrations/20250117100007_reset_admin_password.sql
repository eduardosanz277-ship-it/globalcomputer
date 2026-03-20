-- =============================================
-- Reset explícito password del admin
-- Email(s): admin@example.com / admin@globalcomputer.com
-- Password: Admin*2026!
-- Idempotente: actualiza si existe el usuario.
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

  UPDATE auth.users
  SET encrypted_password = encrypted_pwd,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE email IN ('admin@example.com', 'admin@globalcomputer.com');
END;
$$;

