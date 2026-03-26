-- Remove Unsplash stock photo feature entirely.
-- Restore any plants still using Unsplash URLs to their user-uploaded image.
UPDATE public.plants
SET image_url = user_image_url
WHERE user_image_url IS NOT NULL
  AND image_url LIKE 'https://images.unsplash.com/%';

DROP TABLE IF EXISTS public.stock_photos;

ALTER TABLE public.plants DROP COLUMN IF EXISTS user_image_url;
