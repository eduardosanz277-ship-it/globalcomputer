-- EIN único en perfiles (varias filas con NULL siguen siendo válidas en PostgreSQL).
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_employer_identification_number_key
  UNIQUE (employer_identification_number);
