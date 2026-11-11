-- Agrega columna de consentimiento SMS al formulario de contacto público.
ALTER TABLE IF EXISTS public.contact_messages
  ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.contact_messages.sms_consent IS
  'Indica si el remitente aceptó expresamente recibir mensajes de texto (SMS) de GLOBAL COMPUTERS USA CORP.';
