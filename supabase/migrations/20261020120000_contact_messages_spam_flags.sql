-- Marca mensajes de contacto sospechosos (honeypot, etc.) sin bloquear envíos legítimos.
-- Idempotente: se puede ejecutar varias veces.

ALTER TABLE IF EXISTS public.contact_messages
  ADD COLUMN IF NOT EXISTS is_spam boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spam_reason text;

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_spam_created_at
  ON public.contact_messages (is_spam, created_at DESC);

