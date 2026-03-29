-- Re-add quiz_leads to Realtime: RLS restricts SELECT to admin-only, so non-admin users receive zero events
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_leads;