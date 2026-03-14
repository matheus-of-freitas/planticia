-- Invalidate all cached care tips to force regeneration with
-- Rio de Janeiro-specific prompts via OpenAI (replacing Gemini).
DELETE FROM care_tips;
