// Borra de verdad la cuenta de quien la pide.
//
// Por que existe (1-sep-2026). El boton "Eliminar mi cuenta" vivia entero en el navegador y
// recorria 37 tablas con la sesion de la propia persona. Las tablas que guardan datos suyos son
// 61: quedaban 27 en pie, entre ellas `user_life_profile` (sus miedos, sus suenos, las edades de
// sus hijos, su peor error con el dinero), `financial_worry_entries` (lo que le angustia del
// dinero, escrito por ella), `recurring_bills` (numero de cuenta bancaria, banco y beneficiario)
// y `fiscal_entities` (su identificacion tributaria).
//
// Tres de esas 37 ni siquiera podian borrarse: `expense_tags`, `project_clients` y
// `beta_code_uses` no tienen columna `user_id`, asi que la consulta fallaba por columna
// inexistente. Nadie se enteraba, porque cada borrado iba envuelto en un `catch {}` vacio y la
// pantalla decia "Cuenta eliminada" igual. Y el usuario de autenticacion nunca se borraba: la
// persona podia volver a entrar con el mismo correo.
//
// Esta funcion corre con la llave de servicio (ninguna politica de RLS la frena), borra las 61
// tablas por `user_id` mas las tres que se identifican de otra forma, borra el perfil, borra el
// usuario de autenticacion, y **dice la verdad**: si algo queda sin borrar responde con error y
// con la lista, en vez de felicitar a nadie.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Las 61 tablas con columna `user_id`. El orden pone hijos y registros antes que padres, pero no
// se confia en el: si un borrado falla por una dependencia se vuelve a intentar (hasta 3 vueltas)
// hasta que una vuelta entera no consiga borrar nada nuevo.
const TABLAS_CON_USER_ID = [
  'audit_log',
  'feature_usage_logs',
  'bank_import_sessions',
  'beta_bug_reports',
  'beta_feedback',
  'beta_goal_completions',
  'beta_reward_redemptions',
  'beta_tester_points',
  'beta_referral_codes',
  'bill_payments',
  'budget_rollovers',
  'budget_alert_rules',
  'savings_contributions',
  'financial_focus_sessions',
  'financial_worry_entries',
  'mission_control_history',
  'ecosystem_leaderboard',
  'ecosystem_notifications',
  'ecosystem_streaks',
  'notification_preferences',
  'tax_knowledge_assessment',
  'user_library_favorites',
  'user_life_profile',
  'education_daily_logs',
  'education_practice_logs',
  'financial_habit_logs',
  'financial_habits',
  'financial_journal',
  'financial_education',
  'user_achievements',
  'user_financial_level',
  'user_financial_profile',
  'pay_yourself_first_settings',
  'notifications',
  'net_worth_snapshots',
  'export_logs',
  'ai_usage_logs',
  'usage_tracking',
  'bank_transactions',
  'documents',
  'expenses',
  'income',
  'mileage',
  'contracts',
  'projects',
  'clients',
  'assets',
  'liabilities',
  'savings_goals',
  'investment_goals',
  'category_budgets',
  'tags',
  'settings',
  'user_roles',
  'scan_sessions',
  'user_addresses',
  'decoded_codes',
  'cross_border_transfers',
  'recurring_bills',
  'fiscal_entities',
  'user_subscriptions',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';

    // 1. Quien pide el borrado. El id SIEMPRE sale del token, nunca del cuerpo de la peticion:
    //    asi nadie puede pedir que se borre la cuenta de otra persona.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) return json(401, { error: 'unauthorized' });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) return json(401, { error: 'unauthorized' });
    const userId = userRes.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const errores: Record<string, string> = {};

    // 2. Las tres que no se identifican por `user_id`, primero: cuelgan de filas que se borran
    //    mas abajo.
    const idsDe = async (tabla: string): Promise<string[]> => {
      const { data, error } = await admin.from(tabla).select('id').eq('user_id', userId);
      if (error) {
        errores[tabla + ' (lectura previa)'] = error.message;
        return [];
      }
      return (data ?? []).map((r: { id: string }) => r.id);
    };

    const expenseIds = await idsDe('expenses');
    if (expenseIds.length > 0) {
      const { error } = await admin.from('expense_tags').delete().in('expense_id', expenseIds);
      if (error) errores['expense_tags'] = error.message;
    }

    const projectIds = await idsDe('projects');
    if (projectIds.length > 0) {
      const { error } = await admin.from('project_clients').delete().in('project_id', projectIds);
      if (error) errores['project_clients'] = error.message;
    }

    {
      const { error } = await admin.from('beta_code_uses').delete().eq('used_by', userId);
      if (error) errores['beta_code_uses'] = error.message;
    }

    // 3. Las 61 por `user_id`, en varias vueltas para no depender del orden.
    let pendientes = [...TABLAS_CON_USER_ID];
    for (let vuelta = 1; vuelta <= 3 && pendientes.length > 0; vuelta++) {
      const fallaron: string[] = [];
      for (const tabla of pendientes) {
        const { error } = await admin.from(tabla).delete().eq('user_id', userId);
        if (error) {
          errores[tabla] = error.message;
          fallaron.push(tabla);
        } else {
          delete errores[tabla];
        }
      }
      if (fallaron.length === pendientes.length) break; // ninguna avanzo: otra vuelta no ayuda
      pendientes = fallaron;
    }

    // 4. El perfil se identifica por `id`, no por `user_id`.
    const { error: perfilErr } = await admin.from('profiles').delete().eq('id', userId);
    if (perfilErr) errores['profiles'] = perfilErr.message;

    // 5. El usuario de autenticacion. Sin esto la cuenta seguia existiendo y la persona podia
    //    volver a entrar con el mismo correo.
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr) errores['auth.users'] = authErr.message;

    const conError = Object.keys(errores);
    if (conError.length > 0) {
      console.error('[delete-my-account] quedaron datos sin borrar', { userId, errores });
      return json(500, {
        error: 'partial_delete',
        message: 'No se pudo borrar todo, asi que la eliminacion no se da por hecha.',
        tables: conError,
        details: errores,
      });
    }

    console.log('[delete-my-account] cuenta eliminada por completo', { userId });
    return json(200, { ok: true, tablas: TABLAS_CON_USER_ID.length + 4 });
  } catch (e) {
    console.error('[delete-my-account] error inesperado', e);
    return json(500, { error: 'unexpected', message: String(e) });
  }
});
