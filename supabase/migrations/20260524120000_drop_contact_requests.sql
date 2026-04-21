-- Elimina la tabla contact_requests y los triggers asociados
DROP TRIGGER IF EXISTS set_updated_at_contact_requests ON public.contact_requests;
DROP TABLE IF EXISTS public.contact_requests;
