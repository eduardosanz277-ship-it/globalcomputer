-- Mensaje de cotización WhatsApp en inglés (locale en).
alter table public.shipping_settings
  add column if not exists whatsapp_message_en text not null default '';

comment on column public.shipping_settings.whatsapp_message_en is
  'Introductory WhatsApp message when the locale is English.';

update public.shipping_settings
set whatsapp_message_en = 'Hello, I would like to request a shipping quote for an order over $10,000.'
where trim(whatsapp_message_en) = '';
