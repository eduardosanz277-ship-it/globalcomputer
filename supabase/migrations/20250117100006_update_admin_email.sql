-- =============================================
-- Actualizar email del admin existente
--  Old: admin@example.com
--  New: admin@globalcomputer.com
-- Idempotente: solo actualiza si existe el viejo
-- y no existe el nuevo.
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com')
     AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@globalcomputer.com')
  THEN
    UPDATE auth.users
    SET email = 'admin@globalcomputer.com',
        updated_at = now()
    WHERE email = 'admin@example.com';
  END IF;
END;
$$;

