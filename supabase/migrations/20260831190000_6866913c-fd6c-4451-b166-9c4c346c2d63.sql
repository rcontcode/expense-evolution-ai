-- Costos de IA: cerrar los ilimitados que salian del bolsillo, y soltar lo que es barato.
--
-- POR QUE. Medido el 2026-08-31 contra el precio oficial de cada proveedor:
--   * Gemini 2.5 Flash (via el gateway de Lovable): $0,30 por millon de tokens de entrada y
--     $2,50 de salida. Escanear una boleta cuesta ~$0,0015; analizar un contrato, ~$0,015.
--     La IA de texto y vision es BARATA: ni un usuario abusivo pasa de ~$3 al mes.
--   * ElevenLabs: 1 credito por CARACTER, ~$0,000165-0,0002 cada uno. Los 120 minutos que traia
--     el plan Pro son 72.000 caracteres = $11,90-$14,40 al mes, contra $14,26 que quedan de la
--     suscripcion de $14,99 despues de la comision de cobro. El plan Pro no dejaba margen.
--
-- La forma de los planes estaba invertida: lo caro (la voz) se regalaba con la mano suelta y lo
-- barato (OCR, contratos, cartolas) era el gancho para subir de plan. Esta migracion lo da vuelta.

-- ---------------------------------------------------------------------------
-- 1. Contadores para las cuatro funciones que hasta hoy no contaban nada
-- ---------------------------------------------------------------------------
ALTER TABLE public.usage_tracking
  ADD COLUMN IF NOT EXISTS ai_credits_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS predictions_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autopilot_runs_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coaching_count       INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 2. Topes por plan para esas mismas cuatro
-- ---------------------------------------------------------------------------
ALTER TABLE public.plan_configurations
  ADD COLUMN IF NOT EXISTS ai_credits_per_month     INTEGER,
  ADD COLUMN IF NOT EXISTS predictions_per_month    INTEGER,
  ADD COLUMN IF NOT EXISTS autopilot_runs_per_month INTEGER,
  ADD COLUMN IF NOT EXISTS coaching_per_month       INTEGER;

-- ---------------------------------------------------------------------------
-- 3. increment_usage aprende los cuatro tipos nuevos
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_usage_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_period DATE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user usage';
  END IF;

  v_current_period := date_trunc('month', now())::date;

  INSERT INTO public.usage_tracking (user_id, period_start)
  VALUES (p_user_id, v_current_period)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  IF p_usage_type = 'expense' THEN
    UPDATE public.usage_tracking
    SET expenses_count = expenses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'income' THEN
    UPDATE public.usage_tracking
    SET incomes_count = incomes_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'ocr' THEN
    UPDATE public.usage_tracking
    SET ocr_scans_count = ocr_scans_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'contract' THEN
    UPDATE public.usage_tracking
    SET contract_analyses_count = contract_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'bank' THEN
    UPDATE public.usage_tracking
    SET bank_analyses_count = bank_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'voice' THEN
    UPDATE public.usage_tracking
    SET voice_requests_count = voice_requests_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'ai_credits' THEN
    UPDATE public.usage_tracking
    SET ai_credits_count = ai_credits_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'predictions' THEN
    UPDATE public.usage_tracking
    SET predictions_count = predictions_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'autopilot' THEN
    UPDATE public.usage_tracking
    SET autopilot_runs_count = autopilot_runs_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'coaching' THEN
    UPDATE public.usage_tracking
    SET coaching_count = coaching_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  END IF;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Los numeros de cada plan
-- ---------------------------------------------------------------------------

-- GRATIS. Deja de gastar ElevenLabs: pasa a la voz del navegador, que no cuesta nada y ya estaba
-- implementada como respaldo. Sigue teniendo asistente de voz, solo que no la voz premium. Con
-- los topes de abajo, un usuario gratis pasa de costar ~$0,40 al mes (mas cuatro funciones que
-- no tenian ningun techo) a unos $0,10 en el peor caso.
UPDATE public.plan_configurations SET
  voice_minutes_per_month  = 0,
  ai_credits_per_month     = 20,
  predictions_per_month    = 5,
  autopilot_runs_per_month = 5,
  coaching_per_month       = 10
WHERE plan_type = 'free';

-- PREMIUM. Se le suelta lo barato: el OCR sube de 50 a 300, y por primera vez recibe analisis de
-- contratos y de cartolas (antes 0). Al precio de Gemini Flash eso cuesta ~$1 al mes en el peor
-- caso, y es lo que hace vendible el plan sin tener que empujar al que perdia dinero.
UPDATE public.plan_configurations SET
  ocr_scans_per_month          = 300,
  contract_analyses_per_month  = 20,
  bank_analyses_per_month      = 20,
  ai_credits_per_month         = 200,
  predictions_per_month        = 50,
  autopilot_runs_per_month     = 50,
  coaching_per_month           = 100
WHERE plan_type = 'premium';

-- PRO. Lo barato sigue ilimitado (-1): OCR, contratos y cartolas. Lo caro baja: la voz pasa de
-- 120 a 60 minutos, que es lo que le devuelve el margen al plan. Las cuatro funciones que
-- corrian sin ningun techo quedan con tope alto pero finito.
UPDATE public.plan_configurations SET
  voice_minutes_per_month  = 60,
  ai_credits_per_month     = 1000,
  predictions_per_month    = 200,
  autopilot_runs_per_month = 200,
  coaching_per_month       = 300
WHERE plan_type = 'pro';

-- PRO BETA: nunca por encima del techo de Pro, para que la version de prueba no sea la cara.
UPDATE public.plan_configurations SET
  voice_minutes_per_month  = LEAST(COALESCE(voice_minutes_per_month, 60), 60),
  ai_credits_per_month     = 500,
  predictions_per_month    = 100,
  autopilot_runs_per_month = 100,
  coaching_per_month       = 150
WHERE plan_type = 'pro_beta';

-- Red de seguridad: ningun plan que se cree despues queda sin tope por olvido.
UPDATE public.plan_configurations SET
  ai_credits_per_month     = COALESCE(ai_credits_per_month, 20),
  predictions_per_month    = COALESCE(predictions_per_month, 5),
  autopilot_runs_per_month = COALESCE(autopilot_runs_per_month, 5),
  coaching_per_month       = COALESCE(coaching_per_month, 10)
WHERE ai_credits_per_month IS NULL
   OR predictions_per_month IS NULL
   OR autopilot_runs_per_month IS NULL
   OR coaching_per_month IS NULL;
