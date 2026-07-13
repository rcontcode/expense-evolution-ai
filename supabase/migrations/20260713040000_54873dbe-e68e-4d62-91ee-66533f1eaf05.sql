-- Agrega la columna de consentimiento de marketing a quiz_leads.
-- El quiz YA muestra el checkbox y lo guarda en el estado del formulario
-- (QuizModal.tsx, formData.marketingConsent), pero la tabla no tenía dónde
-- persistirlo: el "sí" del usuario se perdía antes de llegar a la base.
-- Mismo patrón que public.referral_leads.marketing_consent (ver migración
-- 20260113082028_389ed715-78f6-4969-9e89-0de0564ca6dd.sql).
ALTER TABLE public.quiz_leads
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false;
