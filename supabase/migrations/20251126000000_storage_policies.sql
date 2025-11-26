-- Create storage bucket for plant images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('plant-images', 'plant-images', true)
on conflict (id) do nothing;

-- RLS is already enabled on storage.objects by default, so we skip the alter table

-- Allow authenticated users to upload their own images
create policy "Allow authenticated users to upload plant images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-images'
  and (storage.foldername(name))[1] = 'plants'
);

-- Allow authenticated users to update their own images
create policy "Allow authenticated users to update plant images"
on storage.objects for update
to authenticated
using (bucket_id = 'plant-images')
with check (bucket_id = 'plant-images');

-- Allow authenticated users to delete their own images
create policy "Allow authenticated users to delete plant images"
on storage.objects for delete
to authenticated
using (bucket_id = 'plant-images');

-- Allow public read access to all plant images
create policy "Allow public read access to plant images"
on storage.objects for select
to public
using (bucket_id = 'plant-images');
