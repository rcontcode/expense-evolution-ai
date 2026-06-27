UPDATE public.automation_rules SET is_enabled=false WHERE name='Universmind Little — Inscribir Brújula';
DELETE FROM public.lead_nurturing_log WHERE lead_id='821c5ed0-480a-419a-83d4-ee803d8bc6f0';
DELETE FROM public.automation_logs WHERE lead_id='821c5ed0-480a-419a-83d4-ee803d8bc6f0';
DELETE FROM public.lead_interactions WHERE lead_id='821c5ed0-480a-419a-83d4-ee803d8bc6f0';
DELETE FROM public.quiz_leads WHERE id='821c5ed0-480a-419a-83d4-ee803d8bc6f0';