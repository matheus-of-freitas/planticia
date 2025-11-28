-- Drop plant_care_schedules table
DROP TABLE IF EXISTS public.plant_care_schedules;

-- Restore care fields to plants table (if missing)
ALTER TABLE public.plants
ADD COLUMN IF NOT EXISTS watering_interval_days integer DEFAULT 7;
ALTER TABLE public.plants
ADD COLUMN IF NOT EXISTS last_watered_at timestamp with time zone;
ALTER TABLE public.plants
ADD COLUMN IF NOT EXISTS light_preference text;
ALTER TABLE public.plants
ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.plants
ADD COLUMN IF NOT EXISTS watering_hour integer DEFAULT 11;

-- (Optional) Remove notification_id if not needed
-- ALTER TABLE public.plants DROP COLUMN IF EXISTS notification_id;
