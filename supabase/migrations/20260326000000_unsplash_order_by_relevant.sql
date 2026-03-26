-- Matcher v6: add order_by=relevant to Unsplash search.
-- Previous version used default ordering (latest) instead of relevance.

UPDATE public.plants
SET image_url = user_image_url
WHERE user_image_url IS NOT NULL
  AND image_url LIKE 'https://images.unsplash.com/%';

DELETE FROM public.stock_photos;
