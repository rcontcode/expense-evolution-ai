-- Phase 1.1: Remove quiz_leads from Realtime publication (exposes PII to any subscriber)
ALTER PUBLICATION supabase_realtime DROP TABLE public.quiz_leads;

-- Phase 1.2: Add missing UPDATE policy on usage_tracking (prevent users from resetting their counters)
CREATE POLICY "Block client UPDATE on usage_tracking"
ON public.usage_tracking
FOR UPDATE
USING (false)
WITH CHECK (false);