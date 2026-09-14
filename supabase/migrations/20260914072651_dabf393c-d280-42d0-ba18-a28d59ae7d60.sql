create policy "admins manage script files" on storage.objects for all to authenticated
using (bucket_id = 'script-files' and public.has_role(auth.uid(),'admin'))
with check (bucket_id = 'script-files' and public.has_role(auth.uid(),'admin'));