-- YORewards Day 1 · Section D — merchant logo storage
-- Path convention: merchant-logos/{merchant_id}/logo.{ext}
-- App compresses to ~500KB before upload (PRD); bucket limit 2MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'merchant-logos',
  'merchant-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (wallet + card preview)
create policy "merchant_logos_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'merchant-logos');

-- Merchant upload to own folder only
create policy "merchant_logos_merchant_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'merchant-logos'
    and (storage.foldername(name))[1] = public.current_merchant_id()::text
  );

create policy "merchant_logos_merchant_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'merchant-logos'
    and (storage.foldername(name))[1] = public.current_merchant_id()::text
  )
  with check (
    bucket_id = 'merchant-logos'
    and (storage.foldername(name))[1] = public.current_merchant_id()::text
  );

create policy "merchant_logos_merchant_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'merchant-logos'
    and (storage.foldername(name))[1] = public.current_merchant_id()::text
  );
