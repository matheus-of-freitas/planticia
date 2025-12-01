-- Create care_tips table to cache AI-generated care information
CREATE TABLE IF NOT EXISTS public.care_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scientific_name text UNIQUE NOT NULL,
  plant_name text,
  watering jsonb NOT NULL,
  light jsonb NOT NULL,
  soil jsonb NOT NULL,
  fertilizer jsonb NOT NULL,
  temperature jsonb NOT NULL,
  maintenance jsonb NOT NULL,
  problems jsonb NOT NULL,
  special_tips text[] DEFAULT '{}',
  pet_safe boolean DEFAULT true,
  toxicity_warning text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on scientific_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_care_tips_scientific_name ON public.care_tips(scientific_name);

-- Enable RLS (Row Level Security)
ALTER TABLE public.care_tips ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read care tips (read-only for users)
CREATE POLICY "Care tips are viewable by all authenticated users"
  ON public.care_tips
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (via edge functions)
CREATE POLICY "Care tips can be inserted by service role"
  ON public.care_tips
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Care tips can be updated by service role"
  ON public.care_tips
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
