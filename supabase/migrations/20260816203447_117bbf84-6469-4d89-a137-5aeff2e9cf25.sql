DROP POLICY IF EXISTS "Users can insert own audit log" ON public.audit_log;

REVOKE INSERT ON public.audit_log FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _entity_name text DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _action IS NULL OR _entity_type IS NULL THEN
    RAISE EXCEPTION 'action and entity_type are required';
  END IF;

  IF _action NOT IN (
    'create','update','delete','restore','permanent_delete','empty_trash',
    'rollover','import','export','unauthorized_admin_access'
  ) THEN
    RAISE EXCEPTION 'Invalid audit action';
  END IF;

  IF length(_entity_type) > 64 OR length(coalesce(_entity_name,'')) > 256 THEN
    RAISE EXCEPTION 'Invalid audit payload';
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, entity_name, old_values, new_values)
  VALUES (v_uid, _action, _entity_type, _entity_id, _entity_name, _old_values, _new_values)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(text,text,uuid,text,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text,text,uuid,text,jsonb,jsonb) TO authenticated, service_role;