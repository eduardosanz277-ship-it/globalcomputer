-- Estrategia de precios: cost | client_price | business_price | manual
-- Idempotente: seguro si price/discount_client ya fueron eliminados.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pricing_strategy text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS price_client numeric(12, 2),
  ADD COLUMN IF NOT EXISTS price_business numeric(12, 2),
  ADD COLUMN IF NOT EXISTS cost numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_client_pct numeric(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_business_pct numeric(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_client_pct numeric(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_pricing_strategy_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_pricing_strategy_check
  CHECK (
    pricing_strategy IN ('cost', 'client_price', 'business_price', 'manual')
  );

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_margin_client_pct_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_margin_client_pct_check
  CHECK (margin_client_pct >= 0 AND margin_client_pct <= 100);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_margin_business_pct_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_margin_business_pct_check
  CHECK (margin_business_pct >= 0 AND margin_business_pct <= 100);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_discount_client_pct_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_discount_client_pct_check
  CHECK (discount_client_pct >= 0 AND discount_client_pct <= 100);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'price'
  ) THEN
    UPDATE public.products
    SET
      price_client = COALESCE(price_client, price),
      price_business = COALESCE(price_business, price),
      pricing_strategy = 'manual'
    WHERE price_client IS NULL OR price_business IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'discount_client'
  ) THEN
    UPDATE public.products
    SET discount_client_pct = CASE
      WHEN discount_client <= 100 THEN discount_client
      ELSE 0
    END
    WHERE discount_client_pct = 0 AND discount_client > 0;
  END IF;
END $$;

UPDATE public.products
SET price_client = COALESCE(price_client, 0)
WHERE price_client IS NULL;

UPDATE public.products
SET price_business = COALESCE(price_business, 0)
WHERE price_business IS NULL;

ALTER TABLE public.products
  ALTER COLUMN price_client SET NOT NULL,
  ALTER COLUMN price_business SET NOT NULL;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS discount_client;
