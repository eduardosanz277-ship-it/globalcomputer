-- Cooldown OTP: tabla interna solo accesible desde el servidor (service_role).
ALTER TABLE public.otp_resend_locks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.otp_resend_locks FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_resend_locks TO service_role;
