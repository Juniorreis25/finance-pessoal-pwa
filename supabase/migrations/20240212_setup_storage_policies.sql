-- Migration to setup storage policies for avatars
-- Bucket name: avatars

-- 1. Create the bucket if it doesn't exist (Supabase specific)
-- Note: This might fail in some SQL editors if they don't have access to storage schema, 
-- but it's the standard way to do it in migrations.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view avatars
DROP POLICY IF EXISTS "Public View Avatars" ON storage.objects;
CREATE POLICY "Public View Avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- 3. Allow authenticated users to upload their own avatar
-- We expect the path to be either 'USER_ID/filename' or just filename with owner check
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
    );

-- 4. Allow users to update their own avatar (required for upsert)
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid() = owner
    );

-- 5. Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid() = owner
    );
