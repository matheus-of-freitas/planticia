-- Recompute cached stock-photo results for matcher v3.
-- This version relaxes the matching logic for sparse Unsplash metadata while
-- still falling back to user photos when no candidate clears the threshold.

ALTER TABLE public.stock_photos
  ADD COLUMN IF NOT EXISTS match_score integer;

-- Restore existing plant records to the user's original photo until the new
-- matcher repopulates the stock photo cache.
UPDATE public.plants
SET image_url = user_image_url
WHERE user_image_url IS NOT NULL
  AND image_url LIKE 'https://images.unsplash.com/%';

DELETE FROM public.stock_photos;
