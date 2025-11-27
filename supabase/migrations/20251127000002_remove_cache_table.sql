-- Remove plant_id_cache table (no longer needed with Gemini integration)
-- The caching was removed when migrating from PlantNet to Google Gemini

drop policy if exists "Allow public read" on public.plant_id_cache;
drop policy if exists "Service role insert" on public.plant_id_cache;

drop table if exists public.plant_id_cache;
