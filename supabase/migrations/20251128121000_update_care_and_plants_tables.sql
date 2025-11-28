-- Migration to fix plant_care_schedules and plants tables

-- Add missing columns to plant_care_schedules
ALTER TABLE public.plant_care_schedules
ADD COLUMN IF NOT EXISTS watering_hour integer DEFAULT 11;

ALTER TABLE public.plant_care_schedules
ADD COLUMN IF NOT EXISTS last_watered_at timestamp with time zone;

-- Remove care-related fields from plants table if they should only exist in plant_care_schedules
ALTER TABLE public.plants
DROP COLUMN IF EXISTS watering_interval_days;
ALTER TABLE public.plants
DROP COLUMN IF EXISTS last_watered_at;
ALTER TABLE public.plants
DROP COLUMN IF EXISTS light_preference;
ALTER TABLE public.plants
DROP COLUMN IF EXISTS description;

-- (Optional) If you want to keep light_preference and description in plants for display, comment out those lines above.

-- You may want to migrate existing data from plants to plant_care_schedules before dropping columns if needed.
