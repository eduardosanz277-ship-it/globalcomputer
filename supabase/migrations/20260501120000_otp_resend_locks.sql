-- Create a table that tracks cuándo se puede pedir un nuevo OTP por email.
CREATE TABLE IF NOT EXISTS public.otp_resend_locks (
  email TEXT PRIMARY KEY,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_timestamp ON public.otp_resend_locks;
CREATE TRIGGER set_updated_at_timestamp
BEFORE UPDATE ON public.otp_resend_locks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_resend_locks TO authenticated, anon, service_role;
