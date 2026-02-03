-- Create plan_configurations table
CREATE TABLE public.plan_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL UNIQUE,
  
  -- Monthly limits (-1 = unlimited)
  expenses_per_month INTEGER NOT NULL DEFAULT 50,
  incomes_per_month INTEGER NOT NULL DEFAULT 20,
  ocr_scans_per_month INTEGER NOT NULL DEFAULT 5,
  clients_limit INTEGER NOT NULL DEFAULT 2,
  projects_limit INTEGER NOT NULL DEFAULT 2,
  contract_analyses_per_month INTEGER NOT NULL DEFAULT 0,
  bank_analyses_per_month INTEGER NOT NULL DEFAULT 0,
  voice_requests_per_month INTEGER NOT NULL DEFAULT -1,
  voice_minutes_per_month INTEGER NOT NULL DEFAULT 3,
  
  -- Feature flags
  mileage_enabled BOOLEAN NOT NULL DEFAULT false,
  gamification_enabled BOOLEAN NOT NULL DEFAULT false,
  net_worth_enabled BOOLEAN NOT NULL DEFAULT false,
  tax_calendar_enabled BOOLEAN NOT NULL DEFAULT false,
  tags_unlimited BOOLEAN NOT NULL DEFAULT false,
  export_excel_enabled BOOLEAN NOT NULL DEFAULT false,
  fire_calculator_enabled BOOLEAN NOT NULL DEFAULT false,
  mentorship_components INTEGER NOT NULL DEFAULT 0,
  voice_assistant_enabled BOOLEAN NOT NULL DEFAULT true,
  tax_optimizer_enabled BOOLEAN NOT NULL DEFAULT false,
  rrsp_tfsa_optimizer_enabled BOOLEAN NOT NULL DEFAULT false,
  t2125_export_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  display_name TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_configurations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read configurations (public pricing info)
CREATE POLICY "Anyone can read plan configurations" 
ON public.plan_configurations 
FOR SELECT 
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage plan configurations" 
ON public.plan_configurations 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_plan_configurations_updated_at
BEFORE UPDATE ON public.plan_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plan configurations
INSERT INTO public.plan_configurations (
  plan_type, display_name, description, sort_order,
  expenses_per_month, incomes_per_month, ocr_scans_per_month,
  clients_limit, projects_limit, contract_analyses_per_month,
  bank_analyses_per_month, voice_requests_per_month, voice_minutes_per_month,
  mileage_enabled, gamification_enabled, net_worth_enabled,
  tax_calendar_enabled, tags_unlimited, export_excel_enabled,
  fire_calculator_enabled, mentorship_components, voice_assistant_enabled,
  tax_optimizer_enabled, rrsp_tfsa_optimizer_enabled, t2125_export_enabled
) VALUES 
-- Free plan
(
  'free', 'Gratis', 'Plan básico para empezar', 0,
  50, 20, 5,
  2, 2, 0,
  0, -1, 3,
  false, false, false,
  false, false, false,
  false, 0, true,
  false, false, false
),
-- Premium plan
(
  'premium', 'Premium', 'Para usuarios activos', 1,
  -1, -1, 50,
  -1, -1, 0,
  0, -1, 30,
  true, true, true,
  true, true, true,
  false, 4, true,
  false, false, false
),
-- Pro plan
(
  'pro', 'Pro', 'Acceso completo profesional', 2,
  -1, -1, -1,
  -1, -1, -1,
  -1, -1, 120,
  true, true, true,
  true, true, true,
  true, 8, true,
  true, true, true
);