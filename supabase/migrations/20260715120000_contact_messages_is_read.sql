-- Estado de lectura para mensajes de contacto en el panel admin.
alter table public.contact_messages
  add column if not exists is_read boolean not null default false;

alter table public.contact_messages
  add column if not exists read_at timestamptz null;

comment on column public.contact_messages.is_read is
  'If the message has already been opened/read in the admin.';

comment on column public.contact_messages.read_at is
  'Time it was marked as read (null if not yet).';

create index if not exists contact_messages_is_read_created_at_idx
  on public.contact_messages (is_read, created_at desc);
