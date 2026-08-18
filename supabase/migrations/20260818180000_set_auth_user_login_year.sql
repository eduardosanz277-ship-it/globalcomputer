-- Si ya se aplicó 20260818120000, esta versión también guarda el año
-- para {{ .Data.year }} en la plantilla OTP de Auth.

create or replace function public.set_auth_user_login_locale(
  check_email text,
  login_locale text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if login_locale is null or login_locale not in ('es', 'en') then
    return;
  end if;

  update auth.users
  set
    raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'locale', login_locale,
        'year', to_char(timezone('utc', now()), 'YYYY')
      ),
    updated_at = timezone('utc', now())
  where lower(email) = lower(trim(check_email));
end;
$$;

comment on function public.set_auth_user_login_locale(text, text) is
  'Merges locale (es|en) and current year into auth.users.raw_user_meta_data for OTP email templates.';
