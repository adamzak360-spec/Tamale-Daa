-- ============================================================
-- Migration: Create Storage Buckets and Policies for Products
-- Purpose: Ensure product-images and product-videos buckets exist and are publicly accessible with proper upload policies.
-- Date: 2026-08-06
-- ============================================================

-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create product-images bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create product-videos bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-videos', 'product-videos', true, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/m4v'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete for Product Images" ON storage.objects;

DROP POLICY IF EXISTS "Public Access for Product Videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Product Videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete for Product Videos" ON storage.objects;

-- Create policies for product-images
CREATE POLICY "Public Access for Product Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated Upload for Product Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated Delete for Product Images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- Create policies for product-videos
CREATE POLICY "Public Access for Product Videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-videos');

CREATE POLICY "Authenticated Upload for Product Videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-videos');

CREATE POLICY "Authenticated Delete for Product Videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-videos');
