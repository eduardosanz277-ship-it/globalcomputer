-- =============================================
-- Fix login admin:
-- - instance_id en auth.users está en null
-- - asegurar confirmed_at/email_confirmed_at
-- Idempotente (solo corrige si falta)
-- =============================================

DO $$
DECLARE
  default_instance_id uuid;
BEGIN
  SELECT id INTO default_instance_id FROM auth.instances LIMIT 1;
  IF default_instance_id IS NULL THEN
    RAISE NOTICE 'No existe auth.instances; omitiendo fix admin.';
    RETURN;
  END IF;

  -- Asegurar para el admin (por email nuevo) y por rol ADMIN real
  UPDATE auth.users u
  SET
    instance_id = COALESCE(u.instance_id, default_instance_id),
    confirmed_at = COALESCE(u.confirmed_at, u.email_confirmed_at, now()),
    email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
    updated_at = now()
  WHERE u.email IN ('admin@example.com', 'admin@globalcomputer.com')
     OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id AND p.role = 'ADMIN');
END;
$$;

