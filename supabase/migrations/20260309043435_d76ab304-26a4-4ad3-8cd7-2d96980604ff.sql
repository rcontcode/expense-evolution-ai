
CREATE TABLE public.managed_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'development',
  app_type TEXT NOT NULL DEFAULT 'web',
  icon TEXT NOT NULL DEFAULT '📱',
  color TEXT NOT NULL DEFAULT 'from-gray-500 to-gray-600',
  webhook_url TEXT,
  webhook_secret TEXT,
  source_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  lead_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.managed_apps ENABLE ROW LEVEL SECURITY;

-- Only admins can manage apps
CREATE POLICY "Admins can manage apps" ON public.managed_apps
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Insert the existing apps as seed data
INSERT INTO public.managed_apps (name, description, url, status, app_type, icon, color, source_key) VALUES
  ('EvoFinz', 'Plataforma de gestión financiera personal y empresarial con IA', 'https://expense-evolution-ai.lovable.app', 'beta', 'web', '💰', 'from-emerald-500 to-teal-600', 'evofinz'),
  ('Fokuspark', 'App de bienestar, enfoque y productividad financiera', 'https://fokuspark.lovable.app', 'beta', 'web', '🧘', 'from-violet-500 to-purple-600', 'fokuspark'),
  ('TrustlyConnect', 'App de conexión y confianza financiera con quiz integrado', 'https://trustlyconnect.lovable.app', 'beta', 'web', '🤝', 'from-sky-500 to-blue-600', 'TrustlyConnect Quiz');
