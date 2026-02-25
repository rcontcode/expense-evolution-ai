INSERT INTO feature_flags (flag_key, enabled, category, label, description)
VALUES 
  ('ecosystem_onboarding', true, 'ecosystem', 'Onboarding del Ecosistema', 'Muestra el flujo de onboarding del ecosistema para usuarios Bundle'),
  ('ecosystem_insights', true, 'ecosystem', 'Insights Cruzados', 'Habilita insights, coaching, streaks, leaderboard, reportes y alertas predictivas'),
  ('ecosystem_badge', true, 'ecosystem', 'Badge del Ecosistema', 'Muestra el badge Bundle, quick actions y widgets inline')
ON CONFLICT (flag_key) DO UPDATE SET enabled = true;