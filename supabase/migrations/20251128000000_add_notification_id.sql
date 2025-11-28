-- Add notification tracking to plants table
-- Stores expo-notifications identifier for watering reminders

ALTER TABLE public.plants
ADD COLUMN notification_id TEXT;

-- Add index for faster lookups
CREATE INDEX idx_plants_notification_id ON public.plants(notification_id);
