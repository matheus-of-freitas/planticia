-- Add DELETE policy so edge functions can invalidate stale cache entries
CREATE POLICY "Care tips can be deleted by service role"
  ON public.care_tips FOR DELETE TO service_role USING (true);

-- Invalidate all cached tips to regenerate with weather-aware prompts
DELETE FROM care_tips;
