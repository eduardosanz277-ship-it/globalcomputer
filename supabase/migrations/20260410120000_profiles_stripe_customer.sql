-- Stripe Customer (cus_...) por usuario: Checkout puede prellenar envío y reutilizar cliente.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL AND trim(stripe_customer_id) <> '';

COMMENT ON COLUMN public.profiles.stripe_customer_id IS
  'ID de Stripe Customer (cus_...); enlaza pagos y dirección en Checkout';
