
-- Fix search_path warnings
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Storage: replace broad SELECT with targeted file-only SELECT (no listing of arbitrary prefixes)
DROP POLICY IF EXISTS "Public read course-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read resources" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

CREATE POLICY "Public can view course-thumbnails files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'course-thumbnails' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Public can view resources files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'resources' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Public can view avatars files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);
