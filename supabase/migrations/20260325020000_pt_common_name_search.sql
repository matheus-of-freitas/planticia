-- Recompute cached stock-photo results for matcher v4.
-- This version searches by Portuguese common name first (instead of scientific
-- name) with the "planta" suffix, yielding much better Unsplash matches.

-- Restore existing plant records to the user's original photo until the new
-- matcher repopulates the stock photo cache.
UPDATE public.plants
SET image_url = user_image_url
WHERE user_image_url IS NOT NULL
  AND image_url LIKE 'https://images.unsplash.com/%';

DELETE FROM public.stock_photos;
