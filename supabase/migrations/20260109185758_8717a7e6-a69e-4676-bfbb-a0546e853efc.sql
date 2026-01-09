
-- =====================================================
-- FASE 1: Sistema Multi-Jurisdicción EvoFinz
-- =====================================================

-- 1. Tabla principal de entidades fiscales
CREATE TABLE public.fiscal_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Identificación
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  province TEXT,
  
  -- Tipo y régimen fiscal
  entity_type TEXT NOT NULL DEFAULT 'individual',
  tax_regime TEXT,
  
  -- Identificadores fiscales
  tax_id TEXT,
  tax_id_type TEXT,
  
  -- Configuración fiscal
  fiscal_year_end TEXT DEFAULT '12-31',
  default_currency TEXT DEFAULT 'USD',
  
  -- Estado y preferencias
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '💼',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de tipos de cambio históricos
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(from_currency, to_currency, rate_date)
);

-- 3. Tabla de transferencias cross-border
CREATE TABLE public.cross_border_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  from_entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL,
  to_entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL,
  
  amount_from DECIMAL(15,2) NOT NULL,
  currency_from TEXT NOT NULL,
  amount_to DECIMAL(15,2) NOT NULL,
  currency_to TEXT NOT NULL,
  exchange_rate DECIMAL(18,8) NOT NULL,
  
  transfer_date DATE NOT NULL,
  purpose TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Agregar entity_id a tablas existentes (nullable para compatibilidad)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS original_currency TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS exchange_rate_used DECIMAL(18,8);

ALTER TABLE public.income ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;
ALTER TABLE public.income ADD COLUMN IF NOT EXISTS original_currency TEXT;
ALTER TABLE public.income ADD COLUMN IF NOT EXISTS exchange_rate_used DECIMAL(18,8);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

ALTER TABLE public.mileage ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

-- 5. Agregar campo de moneda de visualización global al perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS multi_country_enabled BOOLEAN DEFAULT false;

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_fiscal_entities_user_id ON public.fiscal_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_entities_country ON public.fiscal_entities(country);
CREATE INDEX IF NOT EXISTS idx_fiscal_entities_is_primary ON public.fiscal_entities(user_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON public.exchange_rates(from_currency, to_currency, rate_date);

CREATE INDEX IF NOT EXISTS idx_expenses_entity_id ON public.expenses(entity_id);
CREATE INDEX IF NOT EXISTS idx_income_entity_id ON public.income(entity_id);
CREATE INDEX IF NOT EXISTS idx_clients_entity_id ON public.clients(entity_id);
CREATE INDEX IF NOT EXISTS idx_contracts_entity_id ON public.contracts(entity_id);
CREATE INDEX IF NOT EXISTS idx_projects_entity_id ON public.projects(entity_id);
CREATE INDEX IF NOT EXISTS idx_mileage_entity_id ON public.mileage(entity_id);
CREATE INDEX IF NOT EXISTS idx_assets_entity_id ON public.assets(entity_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_entity_id ON public.liabilities(entity_id);

CREATE INDEX IF NOT EXISTS idx_cross_border_transfers_user_id ON public.cross_border_transfers(user_id);

-- 7. Enable RLS
ALTER TABLE public.fiscal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_border_transfers ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies para fiscal_entities
CREATE POLICY "Users can view their own fiscal entities"
ON public.fiscal_entities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fiscal entities"
ON public.fiscal_entities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fiscal entities"
ON public.fiscal_entities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fiscal entities"
ON public.fiscal_entities FOR DELETE
USING (auth.uid() = user_id);

-- 9. RLS Policies para exchange_rates (lectura pública, escritura restringida)
CREATE POLICY "Anyone can view exchange rates"
ON public.exchange_rates FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert exchange rates"
ON public.exchange_rates FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 10. RLS Policies para cross_border_transfers
CREATE POLICY "Users can view their own transfers"
ON public.cross_border_transfers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transfers"
ON public.cross_border_transfers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transfers"
ON public.cross_border_transfers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transfers"
ON public.cross_border_transfers FOR DELETE
USING (auth.uid() = user_id);

-- 11. Trigger para updated_at en nuevas tablas
CREATE TRIGGER update_fiscal_entities_updated_at
BEFORE UPDATE ON public.fiscal_entities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_border_transfers_updated_at
BEFORE UPDATE ON public.cross_border_transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Función para asegurar solo una entidad primaria por usuario
CREATE OR REPLACE FUNCTION public.ensure_single_primary_entity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.fiscal_entities 
    SET is_primary = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_single_primary_entity_trigger
BEFORE INSERT OR UPDATE ON public.fiscal_entities
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION public.ensure_single_primary_entity();
