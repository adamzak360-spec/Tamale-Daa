-- Migration: Add dynamic product specifications support
-- Date: 2026-08-06
-- Description: Adds specifications JSONB column to products table for scalable dynamic product attributes.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.specifications IS 'Scalable JSONB object storing dynamic product specifications (e.g. Weight, Material, Warranty, Brand, Food Information, etc.).';
