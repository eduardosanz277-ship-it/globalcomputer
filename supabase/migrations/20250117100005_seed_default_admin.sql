-- =============================================
-- Usuario administrador por defecto
-- Email: admin@globalcomputer.com  |  Contraseña: Admin*2026!
-- IMPORTANTE: Cambiar la contraseña tras el primer login.
-- Si esta migración falla (p. ej. schema auth distinto en tu Supabase),
-- crea el admin desde Dashboard > Authentication > Users o con la API.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  admin_id uuid;
  instance_id_val uuid;
  encrypted_pwd text;
BEGIN
  -- Solo crear si no existe ningún perfil con rol ADMIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'ADMIN') THEN
    SELECT id INTO instance_id_val FROM auth.instances LIMIT 1;
    -- pgcrypto en Supabase suele estar en schema "extensions"; si no, en "public"
    BEGIN
      encrypted_pwd := extensions.crypt('Admin*2026!'::text, extensions.gen_salt('bf'::text));
    EXCEPTION WHEN undefined_function THEN
      encrypted_pwd := public.crypt('Admin*2026!'::text, public.gen_salt('bf'::text));
    END;

    admin_id := gen_random_uuid();

    -- role en raw_user_meta_data para que el trigger handle_new_user cree el perfil con ADMIN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      raw_app_meta_data
    ) VALUES (
      admin_id,
      instance_id_val,
      'admin@globalcomputer.com',
      encrypted_pwd,
      now(),
      now(),
      now(),
      '{"full_name":"Administrador","role":"ADMIN"}'::jsonb,
      '{}'::jsonb
    );
    -- El trigger on_auth_user_created inserta en public.profiles usando full_name y role de raw_user_meta_data
  END IF;
END;
$$;
