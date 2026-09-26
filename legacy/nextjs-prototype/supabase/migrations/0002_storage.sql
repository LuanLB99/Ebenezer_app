-- Buckets do Supabase Storage para fotos de membros, imagens do boletim,
-- letras/cifras (PDF ou imagem) e áudios-guia (ver spec-tecnica.md, seção 1: Extras).

insert into storage.buckets (id, name, public)
values
  ('member-photos', 'member-photos', true),
  ('bulletin-images', 'bulletin-images', true),
  ('song-sheets', 'song-sheets', true),
  ('song-audio', 'song-audio', true)
on conflict (id) do nothing;

-- Leitura pública (o app inteiro é interno/autenticado no nível da tela,
-- mas os arquivos em si podem ser servidos por URL pública sem expor dados sensíveis).
create policy "public_read_member_photos" on storage.objects
  for select using (bucket_id = 'member-photos');
create policy "public_read_bulletin_images" on storage.objects
  for select using (bucket_id = 'bulletin-images');
create policy "public_read_song_sheets" on storage.objects
  for select using (bucket_id = 'song-sheets');
create policy "public_read_song_audio" on storage.objects
  for select using (bucket_id = 'song-audio');

-- Upload restrito a usuários autenticados.
create policy "authenticated_upload_member_photos" on storage.objects
  for insert with check (bucket_id = 'member-photos' and auth.role() = 'authenticated');
create policy "authenticated_upload_bulletin_images" on storage.objects
  for insert with check (bucket_id = 'bulletin-images' and auth.role() = 'authenticated');
create policy "authenticated_upload_song_sheets" on storage.objects
  for insert with check (bucket_id = 'song-sheets' and auth.role() = 'authenticated');
create policy "authenticated_upload_song_audio" on storage.objects
  for insert with check (bucket_id = 'song-audio' and auth.role() = 'authenticated');
