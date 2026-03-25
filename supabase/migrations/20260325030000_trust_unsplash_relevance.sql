-- Matcher v5: trust Unsplash search relevance, remove cross-language scoring.
-- Portuguese common names (Hortelã, Salsinha) couldn't match English metadata
-- (mint, parsley), causing all results to be rejected.

UPDATE public.plants
SET image_url = user_image_url
WHERE user_image_url IS NOT NULL
  AND image_url LIKE 'https://images.unsplash.com/%';

DELETE FROM public.stock_photos;
