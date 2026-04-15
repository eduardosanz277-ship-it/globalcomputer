-- Datos de identidad visibles para reseñas de producto (incluye invitados).

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS reviewer_email text;

-- Backfill para reseñas históricas: usar perfil si existe.
UPDATE public.reviews r
SET reviewer_name = COALESCE(NULLIF(p.full_name, ''), 'Cliente')
FROM public.profiles p
WHERE r.reviewer_name IS NULL
  AND r.user_id = p.id;

UPDATE public.reviews
SET reviewer_name = 'Cliente'
WHERE reviewer_name IS NULL;

ALTER TABLE public.reviews
  ALTER COLUMN reviewer_name SET NOT NULL;
