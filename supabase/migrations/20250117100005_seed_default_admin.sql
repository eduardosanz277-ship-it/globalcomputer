-- =============================================
-- Usuario administrador por defecto
-- Email: admin@example.com  |  Contraseña: ChangeMe123!
-- IMPORTANTE: Cambiar la contraseña tras el primer login.
-- Si esta migración falla (p. ej. schema auth distinto en tu Supabase),
-- crea el admin desde Dashboard > Authentication > Users o con la API.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid;
  instance_id_val uuid;
BEGIN
  -- Solo crear si no existe ningún perfil con rol ADMIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'ADMIN') THEN
    SELECT id INTO instance_id_val FROM auth.instances LIMIT 1;

    INSERT INTO auth.users (
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      raw_app_meta_data
    ) VALUES (
      instance_id_val,
      'admin@example.com',
      crypt('ChangeMe123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"full_name":"Administrador"}'::jsonb,
      '{}'::jsonb
    )
    RETURNING id INTO admin_id;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (admin_id, 'Administrador', 'ADMIN');
  END IF;
END;
$$;
