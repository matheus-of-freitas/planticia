-- Stock photo cache: stores Unsplash results keyed by scientific name
-- Follows same pattern as care_tips table (shared cache, readable by authenticated users)

CREATE TABLE public.stock_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scientific_name text UNIQUE NOT NULL,
  image_url text NOT NULL DEFAULT '',  -- '' = negative cache (no photo found)
  attribution text,
  photographer_name text,
  photographer_url text,
  source text NOT NULL DEFAULT 'unsplash',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stock_photos_scientific_name ON public.stock_photos(scientific_name);

ALTER TABLE public.stock_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock photos viewable by authenticated"
  ON public.stock_photos FOR SELECT TO authenticated USING (true);

-- Add user_image_url to plants for storing the original captured photo
-- image_url will now hold the stock photo URL (when available)
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS user_image_url text;
